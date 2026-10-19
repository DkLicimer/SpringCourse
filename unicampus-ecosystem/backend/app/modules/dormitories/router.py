import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.curators.models import Student
from app.modules.dormitories.models import (
    Dormitory, DormRoom, DormBed, DormApplication, DormApplicationStatus
)
from app.modules.dormitories import schemas
from app.modules.dormitories.services import DormitoryService

router = APIRouter(prefix="/dormitories", tags=["6. Общежития кампуса"])


@router.get("/buildings", response_model=List[schemas.DormitoryResponse])
def get_dormitories(db: Session = Depends(get_db)):
    """Список общежитий с расчетом свободных и занятых мест"""
    dorms = db.query(Dormitory).filter(Dormitory.is_active == True).order_by(Dormitory.number.asc()).all()
    results = []
    for d in dorms:
        total = db.query(DormBed).join(DormRoom).filter(DormRoom.dormitory_id == d.id).count()
        free = db.query(DormBed).join(DormRoom).filter(DormRoom.dormitory_id == d.id, DormBed.is_occupied == False).count()
        
        dto = schemas.DormitoryResponse.model_validate(d)
        dto.total_beds = total
        dto.free_beds = free
        results.append(dto)
    return results


@router.post("/buildings", response_model=schemas.DormitoryResponse, status_code=status.HTTP_201_CREATED)
def create_dormitory(
    dorm_in: schemas.DormitoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Добавление нового общежития с автогенерацией комнат (только администратор)"""
    dorm = DormitoryService.create_dormitory_with_rooms(db, dorm_in)
    return dorm


@router.get("/buildings/{dorm_id}/rooms", response_model=List[schemas.DormRoomResponse])
def get_dorm_rooms(
    dorm_id: int,
    floor: Optional[int] = Query(None, description="Фильтр по этажу"),
    db: Session = Depends(get_db)
):
    """Список комнат и коек выбранного общежития"""
    query = db.query(DormRoom).filter(DormRoom.dormitory_id == dorm_id, DormRoom.is_active == True)
    if floor:
        query = query.filter(DormRoom.floor == floor)
    return query.order_by(DormRoom.room_number.asc()).all()


@router.post("/applications", response_model=schemas.DormApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_dormitory(
    payload: schemas.DormApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Подача студентом заявления на заселение / переселение"""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        student = db.query(Student).filter(
            Student.last_name.ilike(current_user.full_name.split()[0])
        ).first()

    if not student:
        raise HTTPException(status_code=400, detail="Профиль студента не найден. Обратитесь к куратору вашей группы.")

    existing_active = db.query(DormApplication).filter(
        DormApplication.student_id == student.id,
        DormApplication.status == DormApplicationStatus.PENDING
    ).first()
    if existing_active:
        raise HTTPException(status_code=400, detail="У вас уже есть активная заявка на рассмотрении.")

    app = DormApplication(
        student_id=student.id,
        user_id=current_user.id,
        application_type=payload.application_type,
        preferred_dorm_id=payload.preferred_dorm_id,
        priority_reason=payload.priority_reason,
        comment=payload.comment,
        status=DormApplicationStatus.PENDING
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    res = schemas.DormApplicationResponse.model_validate(app)
    res.student_name = f"{student.last_name} {student.first_name}"
    res.group_name = student.group.name if student.group else "—"
    return res


@router.get("/my-applications", response_model=List[schemas.DormApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """История и текущий статус заявлений студента"""
    apps = db.query(DormApplication).filter(
        DormApplication.user_id == current_user.id
    ).order_by(DormApplication.created_at.desc()).all()

    result = []
    for a in apps:
        res = schemas.DormApplicationResponse.model_validate(a)
        res.student_name = current_user.full_name
        res.group_name = a.student.group.name if a.student and a.student.group else "—"
        result.append(res)
    return result


@router.get("/applications/pending", response_model=List[schemas.DormApplicationResponse])
def get_pending_applications(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))
):
    """Очередь заявлений на рассмотрение жилищным отделом и комендантами"""
    pending = db.query(DormApplication).filter(
        DormApplication.status == DormApplicationStatus.PENDING
    ).order_by(DormApplication.created_at.asc()).all()

    result = []
    for a in pending:
        res = schemas.DormApplicationResponse.model_validate(a)
        if a.student:
            res.student_name = f"{a.student.last_name} {a.student.first_name}"
            res.group_name = a.student.group.name if a.student.group else "—"
        result.append(res)
    return result


@router.post("/applications/{app_id}/review", response_model=schemas.DormApplicationResponse)
def review_application(
    app_id: uuid.UUID,
    review_data: schemas.DormApplicationReview,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))
):
    """Одобрение заявления с распределением конкретного места либо отказ"""
    app = DormitoryService.review_application(db, app_id, review_data, admin.id)
    res = schemas.DormApplicationResponse.model_validate(app)
    if app.student:
        res.student_name = f"{app.student.last_name} {app.student.first_name}"
        res.group_name = app.student.group.name if app.student.group else "—"
    return res


@router.get("/stats", response_model=schemas.DormStatsResponse)
def get_housing_stats(db: Session = Depends(get_db)):
    """Сводка занятости коечного фонда общежитий университета"""
    return DormitoryService.get_stats(db)