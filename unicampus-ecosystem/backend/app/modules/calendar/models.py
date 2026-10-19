import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Table, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

# Связующая таблица Мероприятия <-> Академические группы
event_target_groups = Table(
    "event_target_groups",
    Base.metadata,
    Column("event_id", UUID(as_uuid=True), ForeignKey("university_events.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", UUID(as_uuid=True), ForeignKey("academic_groups.id", ondelete="CASCADE"), primary_key=True)
)


class EventCategory(str, enum.Enum):
    EDUCATIONAL = "Воспитательное"
    CREATIVE = "Творческое"
    PATRIOTIC = "Патриотическое"
    PREVENTIVE = "Профилактическое"
    CEREMONIAL = "Торжественное"
    SPORT = "Спортивное"
    ACADEMIC = "Научно-образовательное"


class TargetAudienceType(str, enum.Enum):
    ALL = "all"            # Для всех студентов и кураторов вуза
    COURSE = "course"      # Для определенного курса
    FACULTY = "faculty"    # Для конкретного факультета/института
    GROUPS = "groups"      # Выборочные академические группы


class UniversityEvent(Base):
    __tablename__ = "university_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Диапазон дат (поддержка однодневных и многодневных форумов/фестивалей)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True, index=True)
    
    location = Column(String(255), nullable=False)
    category = Column(Enum(EventCategory), default=EventCategory.EDUCATIONAL, nullable=False)
    
    # 🔴 Обязательное (красный маркер) или 🟠 На выбор (оранжевый маркер)
    is_mandatory = Column(Boolean, default=False, nullable=False)
    
    # Таргетинг аудитории
    target_type = Column(Enum(TargetAudienceType), default=TargetAudienceType.ALL, nullable=False)
    target_course = Column(Integer, nullable=True)
    target_faculty = Column(String(150), nullable=True)

    # Опциональная связь с забронированным залом (если бронировался через систему)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    
    # Опциональная связь с плановой задачей куратора (для автогенерации отчета)
    associated_task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Отношения
    room = relationship("app.modules.booking.models.Room")
    associated_task = relationship("app.modules.curators.models.Task")
    creator = relationship("app.modules.auth.models.User")
    target_groups = relationship("app.modules.curators.models.AcademicGroup", secondary=event_target_groups)