import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.booking.models import (
    Room, SpaceBooking, SpaceBookingStatus, 
    Cabin, RecreationBooking, RecreationBookingStatus, PaymentReceipt
)
from app.modules.booking import schemas
from app.modules.booking.services import SpaceBookingService, RecreationBookingService

router = APIRouter(prefix="/booking", tags=["2. Бронирование пространств и База отдыха"])


# --- АУДИТОРИИ И ПРОСТРАНСТВА ---

@router.get("/spaces/rooms", response_model=List[schemas.RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    """Публичный каталог доступных аудиторий, актовых залов и коворкингов"""
    return db.query(Room).filter(Room.is_active == True).all()


@router.get("/spaces/rooms/{room_id}/schedule", response_model=List[schemas.SpaceScheduleSlot])
def get_room_schedule(
    room_id: int, 
    start_date: date = Query(..., description="ГГГГ-ММ-ДД"), 
    end_date: date = Query(..., description="ГГГГ-ММ-ДД"), 
    db: Session = Depends(get_db)
):
    """Сетка занятости зала для календаря"""
    return db.query(SpaceBooking).filter(
        SpaceBooking.room_id == room_id,
        SpaceBooking.status == SpaceBookingStatus.APPROVED,
        SpaceBooking.start_time >= start_date,
        SpaceBooking.end_time <= end_date
    ).all()


@router.post("/spaces/applications", response_model=schemas.SpaceBookingResponse, status_code=status.HTTP_201_CREATED)
def apply_for_space(
    payload: schemas.SpaceBookingCreate, 
    db: Session = Depends(get_db)
):
    """Подача заявки на бронирование помещения"""
    return SpaceBookingService.create_booking(db, payload)


@router.patch("/spaces/applications/{booking_id}/status")
def update_space_booking_status(
    booking_id: int,
    action: schemas.SpaceBookingStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.MODERATOR_SPACES]))
):
    """Согласование или отклонение заявки модератором пространств"""
    booking = db.query(SpaceBooking).filter(SpaceBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    booking.status = action.status
    if action.rejection_reason:
        booking.rejection_reason = action.rejection_reason
        
    db.commit()
    return {"message": f"Статус заявки обновлен на {action.status.value}"}


# --- БАЗА ОТДЫХА ---

@router.get("/recreation/cabins/available", response_model=List[schemas.CabinResponse])
def get_available_cabins(
    start_date: date = Query(...),
    end_date: date = Query(...),
    role: schemas.RecreationUserRole = Query(schemas.RecreationUserRole.STAFF),
    db: Session = Depends(get_db)
):
    """Поиск домиков на карте с расчетом доступности по датам"""
    booked_cabin_ids = db.query(RecreationBooking.cabin_id).filter(
        RecreationBooking.status.in_([
            RecreationBookingStatus.PENDING,
            RecreationBookingStatus.RECEIPT_UPLOADED,
            RecreationBookingStatus.CONFIRMED
        ]),
        RecreationBooking.start_date < end_date,
        RecreationBooking.end_date > start_date
    ).all()
    booked_ids = {c[0] for c in booked_cabin_ids}

    cabins = db.query(Cabin).filter(Cabin.is_active == True).order_by(Cabin.number).all()
    result = []
    for c in cabins:
        is_avail = c.id not in booked_ids
        if role == schemas.RecreationUserRole.STUDENT and c.price_student_bed <= 0:
            is_avail = False
            
        dto = schemas.CabinResponse.model_validate(c)
        dto.is_available = is_avail
        result.append(dto)
        
    return result


@router.post("/recreation/bookings", response_model=schemas.RecreationBookingResponse, status_code=status.HTTP_201_CREATED)
def create_recreation_booking(
    payload: schemas.RecreationBookingCreate,
    db: Session = Depends(get_db)
):
    """Бронирование домика на базе отдыха"""
    return RecreationBookingService.create_booking(db, payload)


@router.post("/recreation/bookings/{booking_id}/upload-receipt")
def upload_payment_receipt(
    booking_id: uuid.UUID,
    file_url: str = Form(..., description="URL сохраненного чека"),
    user_comment: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Прикрепление квитанции/чека об оплате"""
    booking = db.query(RecreationBooking).filter(RecreationBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Бронь не найдена")

    receipt = PaymentReceipt(
        booking_id=booking.id,
        file_url=file_url,
        user_comment=user_comment
    )
    db.add(receipt)
    booking.status = RecreationBookingStatus.RECEIPT_UPLOADED
    db.commit()
    return {"message": "Чек отправлен на верификацию бухгалтерией"}