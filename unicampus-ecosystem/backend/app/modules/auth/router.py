import uuid
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.auth import schemas

# Модели для агрегации личного кабинета
from app.modules.curators.models import Student, AcademicGroup, GroupAssignment
from app.modules.rating.models import StudentAchievement, AchievementStatus
from app.modules.dormitories.models import DormStay, DormBed, DormRoom, Dormitory, DormStayStatus
from app.modules.mobility.models import MobilityTrip
from app.modules.learning.models import CourseEnrollment, Course, EnrollmentStatus

router = APIRouter(prefix="/auth", tags=["1. Единая Авторизация (SSO Gateway)"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Универсальный вход: принимает логин или email,
    валидирует пароль и возвращает JWT токен вместе с ролью.
    """
    login_id = form_data.username.strip().lower()
    
    user = db.query(User).filter(
        or_(
            User.username.ilike(login_id),
            User.email.ilike(login_id)
        )
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин/email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Учетная запись заблокирована")

    token = create_access_token(subject=user.id, role=user.role.value)
    
    return schemas.TokenResponse(
        access_token=token,
        role=user.role,
        full_name=user.full_name,
        is_ddm_officer=user.is_ddm_officer
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Возвращает информацию о текущем авторизованном пользователе"""
    return current_user


@router.get("/profile-summary")
def get_profile_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Агрегированные данные для Личного кабинета:
    собирает статус в общежитии, баллы рейтинга, привязанную группу и сертификаты
    """
    summary = {
        "user_id": str(current_user.id),
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone,
        "role": current_user.role.value,
        "is_ddm_officer": current_user.is_ddm_officer,
        "student_profile": None,
        "curator_profile": None,
        "stats": {}
    }

    # 1. Если пользователь — студент
    if current_user.role == UserRole.STUDENT:
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if not student:
            student = db.query(Student).filter(
                Student.last_name.ilike(current_user.full_name.split()[0])
            ).first()

        if student:
            # Староста группы?
            is_starosta = db.query(GroupAssignment).filter(
                GroupAssignment.user_id == current_user.id,
                GroupAssignment.academic_group_id == student.academic_group_id,
                GroupAssignment.role_code == "STAROSTA",
                GroupAssignment.unassigned_at.is_(None)
            ).first() is not None

            # Баллы рейтинга ПГАС
            pgas_points = db.query(func.coalesce(func.sum(StudentAchievement.points_awarded), 0)).filter(
                StudentAchievement.student_id == student.id,
                StudentAchievement.status == AchievementStatus.APPROVED
            ).scalar() or 0

            # Проживание в общежитии
            active_stay = db.query(DormStay).filter(
                DormStay.student_id == student.id,
                DormStay.status == DormStayStatus.ACTIVE
            ).first()

            dorm_info = None
            if active_stay and active_stay.bed:
                bed = active_stay.bed
                room = bed.room
                dorm = room.dormitory if room else None
                dorm_info = {
                    "order_number": active_stay.order_number,
                    "dorm_name": dorm.name if dorm else "Общежитие",
                    "dorm_address": dorm.address if dorm else "",
                    "room_number": room.room_number if room else "",
                    "bed_number": bed.bed_number,
                    "check_in_date": active_stay.check_in_date
                }

            # Последняя командировка
            last_trip = db.query(MobilityTrip).filter(
                MobilityTrip.student_id == student.id
            ).order_by(MobilityTrip.created_at.desc()).first()

            trip_info = None
            if last_trip:
                trip_info = {
                    "title": last_trip.title,
                    "destination": last_trip.destination_city,
                    "dates": f"{last_trip.start_date} — {last_trip.end_date}",
                    "status": last_trip.status.value,
                    "budget": float(last_trip.total_estimated_budget)
                }

            # Сертификаты LMS
            certificates_count = db.query(CourseEnrollment).filter(
                CourseEnrollment.user_id == current_user.id,
                CourseEnrollment.status == EnrollmentStatus.COMPLETED
            ).count()

            summary["student_profile"] = {
                "student_id": str(student.id),
                "group_name": student.group.name if student.group else "—",
                "faculty": student.group.faculty if student.group else "—",
                "course": student.group.course if student.group else 1,
                "training_direction": student.group.training_direction if student.group else "—",
                "is_starosta": is_starosta,
                "is_union_member": student.is_union_member,
                "qr_token": student.qr_token,
                "pgas_points": int(pgas_points),
                "dormitory": dorm_info,
                "mobility_trip": trip_info,
                "certificates_count": certificates_count
            }

    # 2. Если куратор
    elif current_user.role in [UserRole.CURATOR, UserRole.HEAD_CURATOR]:
        assignments = db.query(GroupAssignment).filter(
            GroupAssignment.user_id == current_user.id,
            GroupAssignment.unassigned_at.is_(None)
        ).all()
        summary["curator_profile"] = {
            "assigned_groups": [a.group.name for a in assignments if a.group]
        }

    return summary


@router.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Создание пользователей администратором системы"""
    existing = db.query(User).filter(
        or_(User.username == user_in.username, User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Логин или Email уже заняты")

    new_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower() if user_in.email else None,
        phone=user_in.phone,
        full_name=user_in.full_name.strip(),
        password_hash=hash_password(user_in.password),
        role=user_in.role,
        is_ddm_officer=user_in.is_ddm_officer,
        external_1c_guid=user_in.external_1c_guid
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user