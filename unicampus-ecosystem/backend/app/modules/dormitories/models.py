import uuid
import enum
from datetime import datetime, timezone, date
from sqlalchemy import (
    Column, String, Integer, Boolean, ForeignKey, 
    DateTime, Date, Numeric, Text, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class RoomGenderPolicy(str, enum.Enum):
    MALE = "MALE"        # Мужская комната
    FEMALE = "FEMALE"    # Женская комната
    ANY = "ANY"          # Смешанный/семейный блок


class DormApplicationType(str, enum.Enum):
    CHECK_IN = "CHECK_IN"        # Первичное заселение
    RELOCATION = "RELOCATION"    # Переселение в другую комнату/корпус
    CHECK_OUT = "CHECK_OUT"      # Выселение/освобождение места


class DormApplicationStatus(str, enum.Enum):
    PENDING = "PENDING"        # На рассмотрении жилищным отделом
    APPROVED = "APPROVED"      # Одобрено (выписан ордер)
    REJECTED = "REJECTED"      # Отклонено (нет мест / нарушение)
    COMPLETED = "COMPLETED"    # Студент заселен / ордер закрыт


class DormStayStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"          # Проживает в настоящее время
    TERMINATED = "TERMINATED"  # Договор расторгнут / выселен


class Dormitory(Base):
    __tablename__ = "dormitories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    number = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    commandant_name = Column(String(255), nullable=True)
    commandant_phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    rooms = relationship("DormRoom", back_populates="dormitory", cascade="all, delete-orphan")


class DormRoom(Base):
    __tablename__ = "dorm_rooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dormitory_id = Column(Integer, ForeignKey("dormitories.id", ondelete="CASCADE"), nullable=False, index=True)
    room_number = Column(String(20), nullable=False, index=True)
    floor = Column(Integer, nullable=False)
    capacity_beds = Column(Integer, default=3, nullable=False)
    gender_policy = Column(Enum(RoomGenderPolicy), default=RoomGenderPolicy.ANY, nullable=False)
    price_per_month = Column(Numeric(10, 2), default=1200.00, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    dormitory = relationship("Dormitory", back_populates="rooms")
    beds = relationship("DormBed", back_populates="room", cascade="all, delete-orphan")


class DormBed(Base):
    __tablename__ = "dorm_beds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    room_id = Column(Integer, ForeignKey("dorm_rooms.id", ondelete="CASCADE"), nullable=False, index=True)
    bed_number = Column(Integer, nullable=False)
    is_occupied = Column(Boolean, default=False, nullable=False)
    current_student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="SET NULL"), nullable=True)

    room = relationship("DormRoom", back_populates="beds")
    current_student = relationship("app.modules.curators.models.Student")


class DormApplication(Base):
    __tablename__ = "dorm_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    application_type = Column(Enum(DormApplicationType), default=DormApplicationType.CHECK_IN, nullable=False)
    preferred_dorm_id = Column(Integer, ForeignKey("dormitories.id", ondelete="SET NULL"), nullable=True)
    priority_reason = Column(String(255), nullable=True)  # Основание льготы (сирота, инвалид, баллы рейтинга)
    comment = Column(Text, nullable=True)

    status = Column(Enum(DormApplicationStatus), default=DormApplicationStatus.PENDING, nullable=False, index=True)
    
    # Назначенные при одобрении комната и койка
    assigned_room_id = Column(Integer, ForeignKey("dorm_rooms.id", ondelete="SET NULL"), nullable=True)
    assigned_bed_id = Column(Integer, ForeignKey("dorm_beds.id", ondelete="SET NULL"), nullable=True)
    
    rejection_reason = Column(Text, nullable=True)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("app.modules.curators.models.Student")
    preferred_dorm = relationship("Dormitory")
    assigned_room = relationship("DormRoom")
    assigned_bed = relationship("DormBed")


class DormStay(Base):
    __tablename__ = "dorm_stays"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    bed_id = Column(Integer, ForeignKey("dorm_beds.id", ondelete="RESTRICT"), nullable=False)
    
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=True)
    status = Column(Enum(DormStayStatus), default=DormStayStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("app.modules.curators.models.Student")
    bed = relationship("DormBed")