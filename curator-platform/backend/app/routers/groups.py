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

# Вспомогательный метод для маппинга студента с учетом динамических полей
def map_student_to_response(student: models.Student, db: Session) -> schemas.StudentResponse:
    values = db.query(models.StudentDynamicValue).filter(
        models.StudentDynamicValue.student_id == student.id
    ).all()
    
    dyn_values_responses = []
    for val in values:
        field = db.query(models.DynamicField).filter(models.DynamicField.id == val.field_id).first()
        dyn_values_responses.append(
            schemas.StudentDynamicValueResponse(
                field_id=val.field_id,
                field_label=field.label if field else "Поле удалено",
                field_name=field.name if field else "deleted_field",
                field_type=field.type if field else "text",
                value=val.value
            )
        )
    
    return schemas.StudentResponse(
        id=student.id,
        academic_group_id=student.academic_group_id,
        first_name=student.first_name,
        last_name=student.last_name,
        middle_name=student.middle_name,
        is_union_member=student.is_union_member,
        qr_token=student.qr_token,
        user_id=student.user_id,
        social_categories=[schemas.DirectoryItemResponse.model_validate(c) for c in student.social_categories],
        organizations=[schemas.DirectoryItemResponse.model_validate(o) for o in student.organizations],
        dynamic_values=dyn_values_responses
    )


# 1. Создание академической группы
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


# 4. Назначение ответственного лица
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
        protocol_date=assign_in.protocol_date,
        protocol_file_url=assign_in.protocol_file_url  # Ссылка на файл протокола
    )
    
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    response = schemas.AssignmentResponse.model_validate(new_assignment)
    response.username = user.username
    return response


# 5. Снять ответственное лицо с роли в группе
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


# 6. Получение истории всех назначений группы
@router.get("/{group_id}/history", response_model=List[schemas.AssignmentResponse])
def get_group_assignment_history(
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


# 7. Добавление студентов в группу (с сохранением кастомных полей социального паспорта)
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

    # Сохраняем значения динамических полей, если они заполнены
    if student_in.dynamic_values:
        for val in student_in.dynamic_values:
            # Проверяем существование кастомного поля в каталоге
            field_exists = db.query(models.DynamicField).filter(models.DynamicField.id == val.field_id).first()
            if field_exists:
                db_val = models.StudentDynamicValue(
                    student_id=new_student.id,
                    field_id=val.field_id,
                    value=val.value
                )
                db.add(db_val)
        db.commit()

    return map_student_to_response(new_student, db)


# 8. Получение списка студентов группы
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

    students = query.all()
    return [map_student_to_response(s, db) for s in students]


# 9. Обновление карточки студента
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

    # Удаляем и перезаписываем заново динамические значения
    db.query(models.StudentDynamicValue).filter(models.StudentDynamicValue.student_id == student_id).delete()
    if student_in.dynamic_values:
        for val in student_in.dynamic_values:
            field_exists = db.query(models.DynamicField).filter(models.DynamicField.id == val.field_id).first()
            if field_exists:
                db_val = models.StudentDynamicValue(
                    student_id=student_id,
                    field_id=val.field_id,
                    value=val.value
                )
                db.add(db_val)

    db.commit()
    db.refresh(student)
    return map_student_to_response(student, db)