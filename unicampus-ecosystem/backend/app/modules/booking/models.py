import uuid
import enum
from datetime import datetime, timezone, date
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date, 
    ForeignKey, Numeric, Text, Enum, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


# --- 1. АУДИТОРИИ И ПРОСТРАНСТВА ---

class SpaceBookingStatus(str, enum.Enum):
    PENDING = "PENDING"      # Ожидает одобрения модератором
    APPROVED = "APPROVED"    # Мероприятие согласовано
    REJECTED = "REJECTED"    # Отклонено


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    capacity_seats = Column(Integer, default=30, nullable=False)
    amenities = Column(JSON, default=list, nullable=False)  # Оснащение: ["Проектор", "Микрофоны"]
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    bookings = relationship("SpaceBooking", back_populates="room", cascade="all, delete-orphan")


class SpaceBooking(Base):
    __tablename__ = "space_bookings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    event_name = Column(String(255), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False, index=True)
    
    status = Column(Enum(SpaceBookingStatus), default=SpaceBookingStatus.PENDING, nullable=False, index=True)
    sound_engineer_required = Column(Boolean, default=False, nullable=False)
    
    applicant_full_name = Column(String(255), nullable=False)
    applicant_position = Column(String(255), nullable=False)
    applicant_email = Column(String(255), nullable=False, index=True)
    applicant_phone = Column(String(50), nullable=False)
    rejection_reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    room = relationship("Room", back_populates="bookings")
    user = relationship("app.modules.auth.models.User")


# --- 2. БАЗЫ ОТДЫХА И ТУРБАЗА ---

class CabinCategory(str, enum.Enum):
    STANDARD = "STANDARD"
    COMFORT = "COMFORT"
    VIP = "VIP"


class RecreationBookingStatus(str, enum.Enum):
    PENDING = "PENDING"                    # Ожидает оплаты (1 час)
    RECEIPT_UPLOADED = "RECEIPT_UPLOADED"  # Чек прикреплен заявителем
    CONFIRMED = "CONFIRMED"                # Оплата подтверждена бухгалтерией
    CANCELLED = "CANCELLED"                # Отменена по тайм-ауту
    REJECTED = "REJECTED"                  # Чек отклонен


class RecreationUserRole(str, enum.Enum):
    STAFF = "STAFF"
    STUDENT = "STUDENT"


class GuestCategory(str, enum.Enum):
    ADULT = "ADULT"
    CHILD_FREE = "CHILD_FREE"
    INFANT = "INFANT"
    CHILD_TEEN = "CHILD_TEEN"


class Cabin(Base):
    __tablename__ = "cabins"

    id = Column(Integer, primary_key=True, autoincrement=True)
    number = Column(Integer, unique=True, nullable=False)
    title = Column(String(100), nullable=True)
    category = Column(Enum(CabinCategory), default=CabinCategory.STANDARD, nullable=False)
    capacity = Column(Integer, default=4, nullable=False)
    
    price_staff_full_cabin = Column(Numeric(10, 2), nullable=False)
    price_student_bed = Column(Numeric(10, 2), default=0.00, nullable=False)
    
    # Координаты на интерактивной карте
    map_x = Column(Float, default=0.0, nullable=False)
    map_y = Column(Float, default=0.0, nullable=False)
    
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class RecreationBooking(Base):
    __tablename__ = "recreation_bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_number = Column(String(32), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    cabin_id = Column(Integer, ForeignKey("cabins.id", ondelete="PROTECT"), nullable=False)
    user_role = Column(Enum(RecreationUserRole), nullable=False)
    num_beds_booked = Column(Integer, default=1, nullable=False)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    
    contact_name = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    contact_email = Column(String(255), nullable=False, index=True)
    
    status = Column(Enum(RecreationBookingStatus), default=RecreationBookingStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    cabin = relationship("Cabin")
    guests = relationship("Guest", back_populates="booking", cascade="all, delete-orphan")
    receipt = relationship("PaymentReceipt", back_populates="booking", uselist=False, cascade="all, delete-orphan")


class Guest(Base):
    __tablename__ = "recreation_guests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("recreation_bookings.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    category = Column(Enum(GuestCategory), default=GuestCategory.ADULT, nullable=False)
    document_info = Column(String(100), nullable=True)
    birth_date = Column(Date, nullable=True)

    booking = relationship("RecreationBooking", back_populates="guests")


class PaymentReceipt(Base):
    __tablename__ = "recreation_payment_receipts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("recreation_bookings.id", ondelete="CASCADE"), unique=True, nullable=False)
    file_url = Column(String(500), nullable=False)
    user_comment = Column(Text, nullable=True)
    admin_comment = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    booking = relationship("RecreationBooking", back_populates="receipt")