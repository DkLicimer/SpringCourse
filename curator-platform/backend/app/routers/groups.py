import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/groups",
    tags=["Академические группы"]
)

# 1. Создание академической группы (доступно только Администраторам)
@router.post("/", response_model=schemas.GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    group_in: schemas.GroupCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    existing_group = db.query(models.AcademicGroup).filter(models.AcademicGroup.name == group_in.name).first()
    if existing_group:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Группа с названием '{group_in.name}' уже существует"
        )
    
    new_group = models.AcademicGroup(**group_in.model_dump())
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group


# 2. Получение списка всех групп
@router.get("/", response_model=List[schemas.GroupResponse])
def get_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.system_role == "ADMIN":
        return db.query(models.AcademicGroup).all()
    
    assigned_group_ids = db.query(models.GroupAssignment.academic_group_id).filter(
        models.GroupAssignment.user_id == current_user.id,
        models.GroupAssignment.unassigned_at.is_(None)
    ).subquery()

    return db.query(models.AcademicGroup).filter(models.AcademicGroup.id.in_(assigned_group_ids)).all()


# 3. Детальная информация о группе
@router.get("/{group_id}", response_model=schemas.GroupDetailResponse)
def get_group_details(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.system_role != "ADMIN":
        is_assigned = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.user_id == current_user.id,
            models.GroupAssignment.academic_group_id == group_id,
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет прав для просмотра этой академической группы"
            )

    group = db.query(models.AcademicGroup).filter(models.AcademicGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Группа не найдена")

    students_count = db.query(models.Student).filter(models.Student.academic_group_id == group_id).count()

    active_assignments = db.query(models.GroupAssignment).filter(
        models.GroupAssignment.academic_group_id == group_id,
        models.GroupAssignment.unassigned_at.is_(None)
    ).all()

    curators = []
    starosta = None
    proforg = None

    for assign in active_assignments:
        user = db.query(models.User).filter(models.User.id == assign.user_id).first()
        assign_schema = schemas.AssignmentResponse.model_validate(assign)
        assign_schema.username = user.username if user else "Удаленный пользователь"

        if assign.role_code == "CURATOR":
            curators.append(assign_schema)
        elif assign.role_code == "STAROSTA":
            starosta = assign_schema
        elif assign.role_code == "PROFORG":
            proforg = assign_schema

    return schemas.GroupDetailResponse(
        id=group.id,
        name=group.name,
        faculty=group.faculty,
        training_direction=group.training_direction,
        course=group.course,
        created_at=group.created_at,
        students_count=students_count,
        curators=curators,
        starosta=starosta,
        proforg=proforg
    )


# 4. Назначение ответственного лица (Администратором)
@router.post("/{group_id}/assign", response_model=schemas.AssignmentResponse)
def assign_role_to_group(
    group_id: uuid.UUID,
    assign_in: schemas.AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    group = db.query(models.AcademicGroup).filter(models.AcademicGroup.id == group_id).first()
    user = db.query(models.User).filter(models.User.id == assign_in.user_id).first()
    if not group or not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Группа или Пользователь не найдены")

    if assign_in.role_code == "CURATOR":
        active_curators_count = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.academic_group_id == group_id,
            models.GroupAssignment.role_code == "CURATOR",
            models.GroupAssignment.unassigned_at.is_(None)
        ).count()
        if active_curators_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="В группе уже назначено максимальное число активных кураторов (3)"
            )
    else:
        previous_assignment = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.academic_group_id == group_id,
            models.GroupAssignment.role_code == assign_in.role_code,
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()
        
        if previous_assignment:
            previous_assignment.unassigned_at = datetime.utcnow()
            db.add(previous_assignment)

    new_assignment = models.GroupAssignment(
        user_id=assign_in.user_id,
        academic_group_id=group_id,
        role_code=assign_in.role_code,
        protocol_number=assign_in.protocol_number,
        protocol_date=assign_in.protocol_date
    )
    
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    response = schemas.AssignmentResponse.model_validate(new_assignment)
    response.username = user.username
    return response


# 4.1 Снять ответственное лицо с роли в группе (Раздел 7 и 17 ТЗ)
@router.post("/{group_id}/unassign", response_model=schemas.AssignmentResponse)
def unassign_role_from_group(
    group_id: uuid.UUID,
    user_id: uuid.UUID,
    role_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    assignment = db.query(models.GroupAssignment).filter(
        models.GroupAssignment.academic_group_id == group_id,
        models.GroupAssignment.user_id == user_id,
        models.GroupAssignment.role_code == role_code,
        models.GroupAssignment.unassigned_at.is_(None)
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Активное назначение для данного пользователя и роли не найдено"
        )

    assignment.unassigned_at = datetime.utcnow()
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    response = schemas.AssignmentResponse.model_validate(assignment)
    response.username = user.username if user else "Удаленный пользователь"
    return response


# 4.2 Получение истории всех назначений группы (Раздел 7 и 17 ТЗ)
@router.get("/{group_id}/history", response_model=List[schemas.AssignmentResponse])
def get_group_assignment_history(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Если пользователь не админ, проверяем его причастность к группе
    if current_user.system_role != "ADMIN":
        is_assigned = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.user_id == current_user.id,
            models.GroupAssignment.academic_group_id == group_id,
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет прав для просмотра истории назначений этой группы"
            )

    assignments = db.query(models.GroupAssignment).filter(
        models.GroupAssignment.academic_group_id == group_id
    ).order_by(models.GroupAssignment.assigned_at.desc()).all()

    result = []
    for assign in assignments:
        user = db.query(models.User).filter(models.User.id == assign.user_id).first()
        assign_schema = schemas.AssignmentResponse.model_validate(assign)
        assign_schema.username = user.username if user else "Удаленный пользователь"
        result.append(assign_schema)

    return result


# 5. Добавление студентов в группу (с автоматической привязкой справочников!)
@router.post("/{group_id}/students", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def add_student_to_group(
    group_id: uuid.UUID,
    student_in: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.system_role != "ADMIN":
        is_curator = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.user_id == current_user.id,
            models.GroupAssignment.academic_group_id == group_id,
            models.GroupAssignment.role_code == "CURATOR",
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()
        if not is_curator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Добавлять студентов в эту группу могут только Администраторы или назначенные Кураторы"
            )

    group = db.query(models.AcademicGroup).filter(models.AcademicGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Академическая группа не найдена")

    categories = db.query(models.SocialCategory).filter(
        models.SocialCategory.id.in_(student_in.social_category_ids)
    ).all() if student_in.social_category_ids else []

    organizations = db.query(models.StudentOrganization).filter(
        models.StudentOrganization.id.in_(student_in.organization_ids)
    ).all() if student_in.organization_ids else []

    new_student = models.Student(
        academic_group_id=group_id,
        first_name=student_in.first_name,
        last_name=student_in.last_name,
        middle_name=student_in.middle_name,
        is_union_member=student_in.is_union_member,
        social_categories=categories,
        organizations=organizations
    )
    
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student


# 6. Получение списка студентов группы
@router.get("/{group_id}/students", response_model=List[schemas.StudentResponse])
def get_group_students(
    group_id: uuid.UUID,
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.system_role != "ADMIN":
        is_assigned = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.user_id == current_user.id,
            models.GroupAssignment.academic_group_id == group_id,
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="У вас нет прав для просмотра списка студентов этой группы"
            )

    query = db.query(models.Student).filter(models.Student.academic_group_id == group_id)

    if search:
        search_filter = f"%{search.lower()}%"
        query = query.filter(
            (models.Student.first_name.ilike(search_filter)) |
            (models.Student.last_name.ilike(search_filter)) |
            (models.Student.middle_name.ilike(search_filter))
        )

    return query.all()


# 7. Обновление карточки студента (Раздел 10 и 39 ТЗ)
@router.put("/{group_id}/students/{student_id}", response_model=schemas.StudentResponse)
def update_student_in_group(
    group_id: uuid.UUID,
    student_id: uuid.UUID,
    student_in: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.system_role != "ADMIN":
        is_curator = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.user_id == current_user.id,
            models.GroupAssignment.academic_group_id == group_id,
            models.GroupAssignment.role_code == "CURATOR",
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()
        if not is_curator:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Редактировать студентов в этой группе могут только Администраторы или назначенные Кураторы"
            )

    student = db.query(models.Student).filter(
        models.Student.id == student_id,
        models.Student.academic_group_id == group_id
    ).first()
    
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Студент не найден в этой группе")

    categories = db.query(models.SocialCategory).filter(
        models.SocialCategory.id.in_(student_in.social_category_ids)
    ).all() if student_in.social_category_ids else []

    organizations = db.query(models.StudentOrganization).filter(
        models.StudentOrganization.id.in_(student_in.organization_ids)
    ).all() if student_in.organization_ids else []

    student.first_name = student_in.first_name
    student.last_name = student_in.last_name
    student.middle_name = student_in.middle_name
    student.is_union_member = student_in.is_union_member
    student.social_categories = categories
    student.organizations = organizations

    db.commit()
    db.refresh(student)
    return student