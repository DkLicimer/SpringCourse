import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.curators.models import (
    AcademicGroup, Student, GroupAssignment, DynamicField, StudentDynamicValue,
    SocialCategory, StudentOrganization, AttendanceSession, AttendanceRecord,
    Task, TaskExecution
)
from app.modules.curators import schemas

router = APIRouter(prefix="/curators", tags=["3. Кураторы, Группы и Социальный паспорт"])


# Вспомогательная функция для маппинга динамических полей студента
def map_student_response(student: Student, db: Session) -> schemas.StudentResponse:
    dyn_values = db.query(StudentDynamicValue).filter(StudentDynamicValue.student_id == student.id).all()
    dyn_list = []
    for val in dyn_values:
        field = db.query(DynamicField).filter(DynamicField.id == val.field_id).first()
        dyn_list.append(schemas.DynamicFieldValueResponse(
            field_id=val.field_id,
            field_label=field.label if field else "Поле удалено",
            field_name=field.name if field else "deleted",
            field_type=field.type if field else "text",
            value=val.value
        ))

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
        dynamic_values=dyn_list
    )


# --- 1. АКАДЕМИЧЕСКИЕ ГРУППЫ ---

@router.get("/groups", response_model=List[schemas.GroupResponse])
def get_groups(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Получение списка групп (админ видит все, куратор — свои закрепленные)"""
    if current_user.role in [UserRole.ADMIN, UserRole.HEAD_CURATOR]:
        return db.query(AcademicGroup).order_by(AcademicGroup.name.asc()).all()

    assigned_ids = db.query(GroupAssignment.academic_group_id).filter(
        GroupAssignment.user_id == current_user.id,
        GroupAssignment.unassigned_at.is_(None)
    ).subquery()

    return db.query(AcademicGroup).filter(AcademicGroup.id.in_(assigned_ids)).all()


@router.post("/groups", response_model=schemas.GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(group_in: schemas.GroupCreate, db: Session = Depends(get_db), admin: User = Depends(require_roles([UserRole.ADMIN]))):
    """Создание академической группы"""
    existing = db.query(AcademicGroup).filter(AcademicGroup.name == group_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Группа {group_in.name} уже существует")

    group = AcademicGroup(**group_in.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.get("/groups/{group_id}", response_model=schemas.GroupDetailResponse)
def get_group_details(group_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Детальная информация о группе, кураторах, старосте и профорге"""
    group = db.query(AcademicGroup).filter(AcademicGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    students_count = db.query(Student).filter(Student.academic_group_id == group_id).count()
    assignments = db.query(GroupAssignment).filter(
        GroupAssignment.academic_group_id == group_id,
        GroupAssignment.unassigned_at.is_(None)
    ).all()

    curators = []
    starosta = None
    proforg = None

    for a in assignments:
        u = db.query(User).filter(User.id == a.user_id).first()
        res = schemas.AssignmentResponse.model_validate(a)
        res.username = u.full_name if u else "Удален"

        if a.role_code in ["CURATOR", "SENIOR_CURATOR"]:
            curators.append(res)
        elif a.role_code == "STAROSTA":
            starosta = res
        elif a.role_code == "PROFORG":
            proforg = res

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


# --- 2. СТУДЕНТЫ И СОЦИАЛЬНЫЙ ПАСПОРТ ---

@router.get("/groups/{group_id}/students", response_model=List[schemas.StudentResponse])
def get_group_students(group_id: uuid.UUID, search: Optional[str] = Query(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Список студентов группы с поиском по ФИО"""
    query = db.query(Student).filter(Student.academic_group_id == group_id)
    if search:
        search_fmt = f"%{search.strip().lower()}%"
        query = query.filter((Student.last_name.ilike(search_fmt)) | (Student.first_name.ilike(search_fmt)))

    students = query.order_by(Student.last_name.asc()).all()
    return [map_student_response(s, db) for s in students]


@router.post("/groups/{group_id}/students", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def add_student_to_group(group_id: uuid.UUID, student_in: schemas.StudentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Добавление студента в социальный паспорт группы"""
    categories = db.query(SocialCategory).filter(SocialCategory.id.in_(student_in.social_category_ids)).all() if student_in.social_category_ids else []
    orgs = db.query(StudentOrganization).filter(StudentOrganization.id.in_(student_in.organization_ids)).all() if student_in.organization_ids else []

    new_student = Student(
        academic_group_id=group_id,
        first_name=student_in.first_name,
        last_name=student_in.last_name,
        middle_name=student_in.middle_name,
        is_union_member=student_in.is_union_member,
        social_categories=categories,
        organizations=orgs
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    if student_in.dynamic_values:
        for val in student_in.dynamic_values:
            db.add(StudentDynamicValue(student_id=new_student.id, field_id=val.field_id, value=val.value))
        db.commit()

    return map_student_response(new_student, db)


# --- 3. НАЗНАЧЕНИЕ СТАРОСТ И КУРАТОРОВ ---

@router.post("/groups/{group_id}/assign", response_model=schemas.AssignmentResponse)
def assign_role_in_group(group_id: uuid.UUID, assign_in: schemas.AssignmentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Назначение старосты (из списка студентов) или куратора (пользователя)"""
    target_user_id = assign_in.user_id

    # Если старосту назначают кликом по студенту группы:
    if assign_in.student_id:
        st = db.query(Student).filter(Student.id == assign_in.student_id, Student.academic_group_id == group_id).first()
        if not st:
            raise HTTPException(status_code=404, detail="Студент не найден в этой группе")

        if not st.user_id:
            # Автоматически создаем учетную запись для студента-старосты
            from app.core.security import hash_password
            new_u = User(
                username=f"starosta_{st.last_name.lower()}_{uuid.uuid4().hex[:4]}",
                full_name=f"{st.last_name} {st.first_name}",
                role=UserRole.STUDENT,
                password_hash=hash_password("student123")
            )
            db.add(new_u)
            db.commit()
            db.refresh(new_u)
            st.user_id = new_u.id
            db.commit()

        target_user_id = st.user_id

    # Снимаем предыдущего старосту, если назначается новый
    if assign_in.role_code == "STAROSTA":
        old_starosta = db.query(GroupAssignment).filter(
            GroupAssignment.academic_group_id == group_id,
            GroupAssignment.role_code == "STAROSTA",
            GroupAssignment.unassigned_at.is_(None)
        ).first()
        if old_starosta:
            old_starosta.unassigned_at = datetime.now(timezone.utc)
            db.commit()

    assignment = GroupAssignment(
        user_id=target_user_id,
        academic_group_id=group_id,
        role_code=assign_in.role_code,
        protocol_number=assign_in.protocol_number,
        protocol_date=assign_in.protocol_date,
        protocol_file_url=assign_in.protocol_file_url
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    u = db.query(User).filter(User.id == target_user_id).first()
    res = schemas.AssignmentResponse.model_validate(assignment)
    res.username = u.full_name if u else "—"
    return res


# --- 4. ПОСЕЩАЕМОСТЬ И QR-СКАНИРОВАНИЕ ---

@router.post("/groups/{group_id}/attendance/sessions", response_model=schemas.AttendanceSessionResponse)
def create_attendance_session(group_id: uuid.UUID, session_in: schemas.AttendanceSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Создание кураторского часа и инициализация ведомости группы"""
    new_sess = AttendanceSession(academic_group_id=group_id, title=session_in.title, date=session_in.date)
    db.add(new_sess)
    db.commit()
    db.refresh(new_sess)

    students = db.query(Student).filter(Student.academic_group_id == group_id).all()
    for s in students:
        db.add(AttendanceRecord(session_id=new_sess.id, student_id=s.id, is_present=False, method="manual"))
    db.commit()
    db.refresh(new_sess)

    records_res = []
    for r in new_sess.records:
        st = db.query(Student).filter(Student.id == r.student_id).first()
        records_res.append(schemas.AttendanceRecordResponse(
            student_id=r.student_id,
            student_name=f"{st.last_name} {st.first_name}" if st else "—",
            is_present=r.is_present,
            marked_at=r.marked_at,
            method=r.method
        ))

    return schemas.AttendanceSessionResponse(
        id=new_sess.id,
        academic_group_id=new_sess.academic_group_id,
        title=new_sess.title,
        date=new_sess.date,
        created_at=new_sess.created_at,
        records=records_res
    )


@router.post("/groups/{group_id}/attendance/sessions/{session_id}/scan", response_model=schemas.AttendanceRecordResponse)
def scan_qr_token(group_id: uuid.UUID, session_id: uuid.UUID, scan_in: schemas.QRScanRequest, db: Session = Depends(get_db)):
    """Мгновенная фиксация присутствия при сканировании персонального QR-кода студента"""
    student = db.query(Student).filter(Student.academic_group_id == group_id, Student.qr_token == scan_in.qr_token).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент с таким QR-кодом не зарегистрирован в группе")

    record = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id, AttendanceRecord.student_id == student.id).first()
    if not record:
        record = AttendanceRecord(session_id=session_id, student_id=student.id, is_present=True, method="qr")
        db.add(record)
    else:
        record.is_present = True
        record.method = "qr"
        record.marked_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(record)

    return schemas.AttendanceRecordResponse(
        student_id=student.id,
        student_name=f"{student.last_name} {student.first_name}",
        is_present=record.is_present,
        marked_at=record.marked_at,
        method=record.method
    )


@router.post("/groups/{group_id}/attendance/sessions/{session_id}/records-bulk")
def save_attendance_bulk(group_id: uuid.UUID, session_id: uuid.UUID, records_in: List[schemas.AttendanceBulkUpdate], db: Session = Depends(get_db)):
    """Сохранение ведомости посещаемости вручную (тач-экран/чекбоксы)"""
    for item in records_in:
        rec = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id, AttendanceRecord.student_id == item.student_id).first()
        if rec:
            rec.is_present = item.is_present
            rec.method = item.method
    db.commit()
    return {"message": "Ведомость сохранена"}


# --- 5. ЗАДАЧИ И ОТЧЕТЫ КУРАТОРОВ ---

@router.get("/tasks/my-tasks", response_model=List[schemas.TaskExecutionResponse])
def get_my_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Список поручений и мероприятий для текущего куратора"""
    executions = db.query(TaskExecution).filter(TaskExecution.curator_id == current_user.id).all()
    for e in executions:
        e.task = db.query(Task).filter(Task.id == e.task_id).first()
    return executions


@router.post("/tasks/my-tasks/{execution_id}/submit")
def submit_task_report(execution_id: uuid.UUID, submit_in: schemas.TaskSubmit, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Отправка куратором фотоотчета по задаче"""
    exe = db.query(TaskExecution).filter(TaskExecution.id == execution_id, TaskExecution.curator_id == current_user.id).first()
    if not exe:
        raise HTTPException(status_code=404, detail="Задание не найдено")

    exe.photo_url = submit_in.photo_url
    exe.status = "PENDING"
    exe.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Отчет отправлен на проверку администратору"}


@router.post("/tasks/executions/{execution_id}/review")
def review_task_report(execution_id: uuid.UUID, review: schemas.TaskReview, db: Session = Depends(get_db), admin: User = Depends(require_roles([UserRole.ADMIN]))):
    """Одобрение или возврат отчета куратора на доработку"""
    exe = db.query(TaskExecution).filter(TaskExecution.id == execution_id).first()
    if not exe:
        raise HTTPException(status_code=404, detail="Задание не найдено")

    t = db.query(Task).filter(Task.id == exe.task_id).first()
    if review.approve:
        exe.status = "APPROVED"
        exe.points_awarded = t.points if t else 10
        exe.completed_at = datetime.now(timezone.utc)
        exe.admin_comment = None
    else:
        exe.status = "REVISION"
        exe.admin_comment = review.comment

    db.commit()
    return {"message": "Статус отчета обновлен"}