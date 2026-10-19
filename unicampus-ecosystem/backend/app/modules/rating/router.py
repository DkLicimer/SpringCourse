import uuid
import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.curators.models import Student, AcademicGroup
from app.modules.rating.models import StudentAchievement, AchievementStatus
from app.modules.rating import schemas
from app.modules.rating.services import RatingService

router = APIRouter(prefix="/rating", tags=["5. Рейтинг студентов (Стипендия / ПГАС)"])


@router.post("/achievements", response_model=schemas.AchievementResponse, status_code=status.HTTP_201_CREATED)
def submit_achievement(
    payload: schemas.AchievementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Подача заявки на достижение студентом (загрузка грамоты)"""
    # Ищем профиль студента по учетной записи пользователя
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        # Если студент еще не привязан к User, ищем по совпадению ФИО
        student = db.query(Student).filter(
            Student.last_name.ilike(current_user.full_name.split()[0])
        ).first()

    if not student:
        raise HTTPException(
            status_code=400,
            detail="Профиль студента не найден. Обратитесь к куратору вашей группы для внесения в социальный паспорт."
        )

    achievement = StudentAchievement(
        student_id=student.id,
        user_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description,
        category=payload.category,
        level=payload.level,
        event_date=payload.event_date,
        proof_file_url=payload.proof_file_url,
        semester=payload.semester,
        status=AchievementStatus.PENDING,
        points_awarded=0
    )
    db.add(achievement)
    db.commit()
    db.refresh(achievement)

    res = schemas.AchievementResponse.model_validate(achievement)
    res.student_name = f"{student.last_name} {student.first_name}"
    res.group_name = student.group.name if student.group else "—"
    return res


@router.get("/my-achievements", response_model=List[schemas.AchievementResponse])
def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Список достижений текущего студента"""
    achievements = db.query(StudentAchievement).filter(
        StudentAchievement.user_id == current_user.id
    ).order_by(StudentAchievement.created_at.desc()).all()

    result = []
    for a in achievements:
        res = schemas.AchievementResponse.model_validate(a)
        res.student_name = current_user.full_name
        res.group_name = a.student.group.name if a.student and a.student.group else "—"
        result.append(res)
    return result


@router.get("/achievements/pending", response_model=List[schemas.AchievementResponse])
def get_pending_achievements(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.MODERATOR_RATING, UserRole.HEAD_CURATOR]))
):
    """Очередь заявок на модерацию стипендиальной комиссией"""
    pending = db.query(StudentAchievement).filter(
        StudentAchievement.status == AchievementStatus.PENDING
    ).order_by(StudentAchievement.created_at.asc()).all()

    result = []
    for a in pending:
        res = schemas.AchievementResponse.model_validate(a)
        if a.student:
            res.student_name = f"{a.student.last_name} {a.student.first_name}"
            res.group_name = a.student.group.name if a.student.group else "—"
        result.append(res)
    return result


@router.post("/achievements/{achievement_id}/review", response_model=schemas.AchievementResponse)
def review_achievement(
    achievement_id: uuid.UUID,
    review_data: schemas.AchievementReview,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.MODERATOR_RATING]))
):
    """Одобрение или отклонение достижения с начислением баллов"""
    achievement = RatingService.review_achievement(db, achievement_id, review_data, admin.id)
    res = schemas.AchievementResponse.model_validate(achievement)
    if achievement.student:
        res.student_name = f"{achievement.student.last_name} {achievement.student.first_name}"
        res.group_name = achievement.student.group.name if achievement.student.group else "—"
    return res


@router.get("/leaderboard", response_model=List[schemas.LeaderboardItem])
def get_leaderboard(
    semester: Optional[str] = Query(None, description="Например: 2026-1"),
    faculty: Optional[str] = Query(None, description="Фильтр по факультету"),
    course: Optional[int] = Query(None, ge=1, le=6, description="Фильтр по курсу"),
    db: Session = Depends(get_db)
):
    """Турнирная таблица студентов (лидерборд) с ранжированием по сумме баллов"""
    return RatingService.get_leaderboard(db, semester, faculty, course)


@router.get("/export-csv")
def export_rating_csv(
    semester: Optional[str] = Query(None),
    faculty: Optional[str] = Query(None),
    course: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.MODERATOR_RATING, UserRole.HEAD_CURATOR]))
):
    """Экспорт итоговой ведомости стипендиальной комиссии в CSV (с поддержкой Excel UTF-8-BOM)"""
    leaderboard = RatingService.get_leaderboard(db, semester, faculty, course)

    output = io.StringIO()
    # Записываем маркер UTF-8 BOM для корректного открытия русских букв в Excel
    output.write("\ufeff")
    writer = csv.writer(output, delimiter=";")
    writer.writerow([
        "Место", "ФИО Студента", "Группа", "Факультет", "Курс",
        "Итого баллов", "Учеба", "Наука", "Общественная", "Творчество", "Спорт", "Кол-во достижений"
    ])

    for row in leaderboard:
        writer.writerow([
            row.place, row.full_name, row.group_name, row.faculty, row.course,
            row.total_points, row.study_points, row.science_points,
            row.public_points, row.culture_points, row.sport_points, row.achievements_count
        ])

    csv_data = output.getvalue()
    output.close()

    filename = f"Rating_Stipend_{semester or 'all'}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )