import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/groups/{group_id}/attendance",
    tags=["Контроль посещаемости"]
)

# Небольшая вспомогательная схема для приема сканированного QR-кода
class QRScanRequest(BaseModel):
    qr_token: str


# 1. Создание сессии посещаемости (кураторского часа/занятия)
@router.post("/sessions", response_model=schemas.AttendanceSessionResponse, status_code=status.HTTP_201_CREATED)
def create_attendance_session(
    group_id: uuid.UUID,
    session_in: schemas.AttendanceSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Проверяем, существует ли академическая группа
    group = db.query(models.AcademicGroup).filter(models.AcademicGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Академическая группа не найдена")

    # Проверка прав: куратор этой группы или админ
    if current_user.system_role != "ADMIN":
        is_curator = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.user_id == current_user.id,
            models.GroupAssignment.academic_group_id == group_id,
            models.GroupAssignment.role_code == "CURATOR",
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()
        if not is_curator:
            raise HTTPException(status_code=403, detail="Только куратор группы или администратор могут вести посещаемость")

    # Создаем сессию
    new_session = models.AttendanceSession(
        academic_group_id=group_id,
        title=session_in.title,
        date=session_in.date
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Инициализируем ведомость: по умолчанию добавляем всех студентов группы как отсутствующих
    students = db.query(models.Student).filter(models.Student.academic_group_id == group_id).all()
    for student in students:
        record = models.AttendanceRecord(
            session_id=new_session.id,
            student_id=student.id,
            is_present=False,
            method="manual"
        )
        db.add(record)
    
    db.commit()
    db.refresh(new_session)

    # Формируем ответ
    records_response = []
    for rec in new_session.records:
        student = db.query(models.Student).filter(models.Student.id == rec.student_id).first()
        records_response.append(
            schemas.AttendanceRecordResponse(
                student_id=rec.student_id,
                student_name=f"{student.last_name} {student.first_name} {student.middle_name or ''}".strip(),
                is_present=rec.is_present,
                marked_at=rec.marked_at,
                method=rec.method
            )
        )

    return schemas.AttendanceSessionResponse(
        id=new_session.id,
        academic_group_id=new_session.academic_group_id,
        title=new_session.title,
        date=new_session.date,
        created_at=new_session.created_at,
        records=records_response
    )


# 2. Получение списка всех сессий посещаемости группы
@router.get("/sessions", response_model=List[schemas.AttendanceSessionResponse])
def get_attendance_sessions(
    group_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    sessions = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.academic_group_id == group_id
    ).order_by(models.AttendanceSession.date.desc()).all()

    result = []
    for session in sessions:
        records_response = []
        for rec in session.records:
            student = db.query(models.Student).filter(models.Student.id == rec.student_id).first()
            records_response.append(
                schemas.AttendanceRecordResponse(
                    student_id=rec.student_id,
                    student_name=f"{student.last_name} {student.first_name} {student.middle_name or ''}".strip() if student else "Удаленный студент",
                    is_present=rec.is_present,
                    marked_at=rec.marked_at,
                    method=rec.method
                )
            )
        result.append(
            schemas.AttendanceSessionResponse(
                id=session.id,
                academic_group_id=session.academic_group_id,
                title=session.title,
                date=session.date,
                created_at=session.created_at,
                records=records_response
            )
        )
    return result


# 3. Получение деталей конкретной сессии
@router.get("/sessions/{session_id}", response_model=schemas.AttendanceSessionResponse)
def get_attendance_session_detail(
    group_id: uuid.UUID,
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.academic_group_id == group_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Сессия посещаемости не найдена")

    records_response = []
    for rec in session.records:
        student = db.query(models.Student).filter(models.Student.id == rec.student_id).first()
        records_response.append(
            schemas.AttendanceRecordResponse(
                student_id=rec.student_id,
                student_name=f"{student.last_name} {student.first_name} {student.middle_name or ''}".strip() if student else "Удаленный студент",
                is_present=rec.is_present,
                marked_at=rec.marked_at,
                method=rec.method
            )
        )

    return schemas.AttendanceSessionResponse(
        id=session.id,
        academic_group_id=session.academic_group_id,
        title=session.title,
        date=session.date,
        created_at=session.created_at,
        records=records_response
    )


# 4. Сохранение посещаемости списком (Bulk Update — при ручной отметке на тач-экране телефона)
@router.post("/sessions/{session_id}/records-bulk")
def bulk_update_attendance(
    group_id: uuid.UUID,
    session_id: uuid.UUID,
    records_in: List[schemas.AttendanceRecordSubmit],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.academic_group_id == group_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Сессия посещаемости не найдена")

    for rec in records_in:
        db_rec = db.query(models.AttendanceRecord).filter(
            models.AttendanceRecord.session_id == session_id,
            models.AttendanceRecord.student_id == rec.student_id
        ).first()
        if db_rec:
            db_rec.is_present = rec.is_present
            db_rec.method = rec.method
        else:
            db_rec = models.AttendanceRecord(
                session_id=session_id,
                student_id=rec.student_id,
                is_present=rec.is_present,
                method=rec.method
            )
            db.add(db_rec)
            
    db.commit()
    return {"message": "Посещаемость успешно сохранена"}


# 5. Мгновенная отметка студента по сканированию QR-кода (через камеру смартфона куратора)
@router.post("/sessions/{session_id}/scan", response_model=schemas.AttendanceRecordResponse)
def scan_qr_attendance(
    group_id: uuid.UUID,
    session_id: uuid.UUID,
    scan_in: QRScanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    session = db.query(models.AttendanceSession).filter(
        models.AttendanceSession.id == session_id,
        models.AttendanceSession.academic_group_id == group_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Сессия посещаемости не найдена")

    # Ищем студента внутри выбранной группы по qr_token
    student = db.query(models.Student).filter(
        models.Student.academic_group_id == group_id,
        models.Student.qr_token == scan_in.qr_token
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент с данным QR-кодом не зарегистрирован в этой группе")

    # Ищем существующую запись явки или создаем ее
    db_rec = db.query(models.AttendanceRecord).filter(
        models.AttendanceRecord.session_id == session_id,
        models.AttendanceRecord.student_id == student.id
    ).first()

    if db_rec:
        db_rec.is_present = True
        db_rec.method = "qr"
    else:
        db_rec = models.AttendanceRecord(
            session_id=session_id,
            student_id=student.id,
            is_present=True,
            method="qr"
        )
        db.add(db_rec)
    
    db.commit()
    db.refresh(db_rec)

    return schemas.AttendanceRecordResponse(
        student_id=student.id,
        student_name=f"{student.last_name} {student.first_name} {student.middle_name or ''}".strip(),
        is_present=db_rec.is_present,
        marked_at=db_rec.marked_at,
        method=db_rec.method
    )