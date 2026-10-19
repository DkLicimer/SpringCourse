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


class MobilityTripType(str, enum.Enum):
    CONFERENCE = "Научная конференция"
    FORUM = "Молодежный форум / Хакатон"
    INTERNSHIP = "Профессиональная стажировка"
    ACADEMIC_EXCHANGE = "Академический обмен"
    COMPETITION = "Спортивные / Творческие соревнования"


class MobilityTripStatus(str, enum.Enum):
    DRAFT = "DRAFT"                                  # Черновик
    ON_REVIEW_CURATOR = "ON_REVIEW_CURATOR"          # На проверке у куратора
    ON_REVIEW_DEAN = "ON_REVIEW_DEAN"                # На согласовании в деканате
    ON_REVIEW_ACCOUNTING = "ON_REVIEW_ACCOUNTING"    # На согласовании в бухгалтерии
    APPROVED = "APPROVED"                            # Поездка согласована, издан приказ
    REJECTED = "REJECTED"                            # Отклонено на одном из этапов
    REPORT_SUBMITTED = "REPORT_SUBMITTED"            # Прикреплен отчет о поездке
    COMPLETED = "COMPLETED"                          # Отчет принят, командировка закрыта


class ApprovalStage(str, enum.Enum):
    CURATOR = "CURATOR"
    DEAN = "DEAN"
    ACCOUNTING = "ACCOUNTING"


class MobilityTrip(Base):
    __tablename__ = "mobility_trips"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    trip_type = Column(Enum(MobilityTripType), default=MobilityTripType.CONFERENCE, nullable=False)
    title = Column(String(255), nullable=False)
    destination_city = Column(String(100), nullable=False)
    host_organization = Column(String(255), nullable=False)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    
    # Скан-копия официального приглашения / вызова
    invitation_file_url = Column(String(500), nullable=False)
    
    # Смета расходов
    estimated_transport_cost = Column(Numeric(10, 2), default=0.00, nullable=False)
    estimated_living_cost = Column(Numeric(10, 2), default=0.00, nullable=False)
    estimated_daily_cost = Column(Numeric(10, 2), default=0.00, nullable=False)
    total_estimated_budget = Column(Numeric(10, 2), default=0.00, nullable=False)
    funded_by_university = Column(Boolean, default=True, nullable=False)
    
    status = Column(Enum(MobilityTripStatus), default=MobilityTripStatus.ON_REVIEW_CURATOR, nullable=False, index=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("app.modules.curators.models.Student")
    user = relationship("app.modules.auth.models.User", foreign_keys=[user_id])
    approval_steps = relationship("MobilityApprovalStep", back_populates="trip", cascade="all, delete-orphan", order_by="MobilityApprovalStep.created_at")
    report = relationship("MobilityReport", back_populates="trip", uselist=False, cascade="all, delete-orphan")


class MobilityApprovalStep(Base):
    __tablename__ = "mobility_approval_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("mobility_trips.id", ondelete="CASCADE"), nullable=False, index=True)
    
    stage = Column(Enum(ApprovalStage), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_approved = Column(Boolean, nullable=True)  # True = Одобрено, False = Отклонено, None = Ожидает
    comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    trip = relationship("MobilityTrip", back_populates="approval_steps")
    reviewer = relationship("app.modules.auth.models.User")


class MobilityReport(Base):
    __tablename__ = "mobility_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("mobility_trips.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Подтверждающие документы по итогам
    certificate_file_url = Column(String(500), nullable=False)       # Скан сертификата / диплома участника
    financial_report_file_url = Column(String(500), nullable=True)  # Авансовый отчет / билеты / посадочные талоны
    summary_text = Column(Text, nullable=False)                     # Краткий отчет о результатах поездки
    
    is_accepted = Column(Boolean, default=False, nullable=False)
    admin_comment = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    trip = relationship("MobilityTrip", back_populates="report")