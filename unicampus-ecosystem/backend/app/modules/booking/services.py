import uuid
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.modules.booking.models import (
    Room, SpaceBooking, SpaceBookingStatus, 
    Cabin, RecreationBooking, RecreationBookingStatus, RecreationUserRole, Guest
)
from app.modules.booking import schemas


class SpaceBookingService:
    @staticmethod
    def create_booking(db: Session, data: schemas.SpaceBookingCreate, user_id: uuid.UUID = None) -> SpaceBooking:
        now = datetime.now(timezone.utc)

        if data.start_time >= data.end_time:
            raise HTTPException(status_code=400, detail="Время окончания должно быть позже времени начала")
        if data.start_time < now + timedelta(hours=12):
            raise HTTPException(status_code=400, detail="Бронирование аудиторий доступно минимум за 12 часов")

        # Блокируем запись помещения на время транзакции во избежание Race Condition
        room = db.query(Room).filter(Room.id == data.room_id, Room.is_active == True).with_for_update().first()
        if not room:
            raise HTTPException(status_code=404, detail="Аудитория недоступна или не найдена")

        # Проверка пересечения с УЖЕ ОДОБРЕННЫМИ мероприятиями:
        # Пересечение есть, если (NewStart < ExistingEnd) И (NewEnd > ExistingStart)
        overlap = db.query(SpaceBooking).filter(
            SpaceBooking.room_id == data.room_id,
            SpaceBooking.status == SpaceBookingStatus.APPROVED,
            SpaceBooking.start_time < data.end_time,
            SpaceBooking.end_time > data.start_time
        ).first()

        if overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Выбранное время пересекается с мероприятием '{overlap.event_name}'"
            )

        booking = SpaceBooking(
            room_id=data.room_id,
            user_id=user_id,
            event_name=data.event_name,
            start_time=data.start_time,
            end_time=data.end_time,
            sound_engineer_required=data.sound_engineer_required,
            applicant_full_name=data.applicant_full_name,
            applicant_position=data.applicant_position,
            applicant_email=data.applicant_email,
            applicant_phone=data.applicant_phone,
            status=SpaceBookingStatus.PENDING
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking


class RecreationBookingService:
    @staticmethod
    def calculate_price(cabin: Cabin, role: RecreationUserRole, days: int, guests_count: int) -> float:
        if days <= 0:
            raise HTTPException(status_code=400, detail="Дата выезда должна быть позже даты заезда")
        
        if role == RecreationUserRole.STAFF:
            # Для преподавателей и сотрудников аренда домика целиком
            return float(cabin.price_staff_full_cabin) * days
        else:
            # Для студентов расчет по койко-местам
            if cabin.price_student_bed <= 0:
                raise HTTPException(status_code=400, detail="Этот домик закрыт для студенческого бронирования")
            count = max(1, guests_count)
            return float(cabin.price_student_bed) * count * days

    @classmethod
    def create_booking(cls, db: Session, data: schemas.RecreationBookingCreate, user_id: uuid.UUID = None) -> RecreationBooking:
        days = (data.end_date - data.start_date).days
        if days <= 0:
            raise HTTPException(status_code=400, detail="Минимальный срок аренды — 1 сутки")

        # Блокируем домик от параллельного бронирования
        cabin = db.query(Cabin).filter(Cabin.id == data.cabin_id, Cabin.is_active == True).with_for_update().first()
        if not cabin:
            raise HTTPException(status_code=404, detail="Домик не найден")

        # Проверяем даты на пересечение
        conflict = db.query(RecreationBooking).filter(
            RecreationBooking.cabin_id == data.cabin_id,
            RecreationBooking.status.in_([
                RecreationBookingStatus.PENDING, 
                RecreationBookingStatus.RECEIPT_UPLOADED, 
                RecreationBookingStatus.CONFIRMED
            ]),
            RecreationBooking.start_date < data.end_date,
            RecreationBooking.end_date > data.start_date
        ).first()

        if conflict:
            raise HTTPException(status_code=409, detail="Домик уже занят на выбранные даты")

        total = cls.calculate_price(cabin, data.user_role, days, len(data.guests))
        
        now = datetime.now(timezone.utc)
        booking_no = f"UB-{now.strftime('%y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        rec_booking = RecreationBooking(
            booking_number=booking_no,
            user_id=user_id,
            cabin_id=data.cabin_id,
            user_role=data.user_role,
            num_beds_booked=len(data.guests) or 1,
            start_date=data.start_date,
            end_date=data.end_date,
            total_price=total,
            contact_name=data.contact_name,
            contact_phone=data.contact_phone,
            contact_email=data.contact_email,
            status=RecreationBookingStatus.PENDING,
            expires_at=now + timedelta(hours=2) # 2 часа на оплату и прикрепление чека
        )
        db.add(rec_booking)
        db.commit()
        db.refresh(rec_booking)

        for g in data.guests:
            guest_obj = Guest(
                booking_id=rec_booking.id,
                full_name=g.full_name,
                category=g.category,
                document_info=g.document_info,
                birth_date=g.birth_date
            )
            db.add(guest_obj)
        db.commit()

        return rec_booking