import uuid
import enum
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Date, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class AchievementCategory(str, enum.Enum):
    STUDY = "Учебная"
    SCIENCE = "Научно-исследовательская"
    PUBLIC = "Общественная"
    CULTURE = "Культурно-творческая"
    SPORT = "Спортивная"


class AchievementLevel(str, enum.Enum):
    UNIVERSITY = "Вузовский"
    REGIONAL = "Региональный"
    ALL_RUSSIAN = "Всероссийский"
    INTERNATIONAL = "Международный"


class AchievementStatus(str, enum.Enum):
    PENDING = "PENDING"      # На проверке модератором
    APPROVED = "APPROVED"    # Подтверждено, баллы начислены
    REJECTED = "REJECTED"    # Отклонено (не подтверждено документом)


class StudentAchievement(Base):
    __tablename__ = "student_achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Связка со студентом и пользователем
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(Enum(AchievementCategory), nullable=False, index=True)
    level = Column(Enum(AchievementLevel), default=AchievementLevel.UNIVERSITY, nullable=False)
    event_date = Column(Date, nullable=False)
    
    # Скан подтверждающего документа (диплом, грамота, выписка из приказа)
    proof_file_url = Column(String(500), nullable=False)
    
    status = Column(Enum(AchievementStatus), default=AchievementStatus.PENDING, nullable=False, index=True)
    points_awarded = Column(Integer, default=0, nullable=False)
    
    # Семестр учета (например, "2026-1", "2026-2")
    semester = Column(String(20), nullable=False, index=True)

    # Верификация комиссией
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewer_comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("app.modules.curators.models.Student")
    user = relationship("app.modules.auth.models.User", foreign_keys=[user_id])
    reviewer = relationship("app.modules.auth.models.User", foreign_keys=[reviewer_id])