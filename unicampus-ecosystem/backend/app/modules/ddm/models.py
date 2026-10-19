import uuid
import enum
from datetime import datetime, timezone, date
from sqlalchemy import (
    Column, String, Integer, Boolean, ForeignKey, 
    DateTime, Date, Text, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class BenefitCategory(str, enum.Enum):
    LARGE_FAMILY = "Многодетная семья"
    SVO_PARTICIPANT = "Участник СВО / Ветеран боевых действий"
    SVO_FAMILY_MEMBER = "Член семьи участника СВО"
    ORPHAN = "Сирота / Оставшийся без попечения"
    DISABILITY = "Инвалидность I-II группы"
    LOW_INCOME = "Малоимущие граждане"


class DDMAuditAction(str, enum.Enum):
    VIEW_LIST = "VIEW_LIST"            # Просмотр общего списка льготников
    VIEW_RECORD = "VIEW_RECORD"        # Детальное открытие закрытой карточки
    CREATE_RECORD = "CREATE_RECORD"    # Внесение нового лица в реестр
    UPDATE_RECORD = "UPDATE_RECORD"    # Корректировка сведений/льгот
    DELETE_RECORD = "DELETE_RECORD"    # Архивация/удаление карточки
    EXPORT_DATA = "EXPORT_DATA"        # Выгрузка отчета


class DDMProfile(Base):
    __tablename__ = "ddm_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # ФИО и базовая идентификация
    full_name = Column(String(255), nullable=False, index=True)
    birth_date = Column(Date, nullable=False)
    phone = Column(String(50), nullable=True)
    
    # Опциональная связка со студентом или сотрудником вуза
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Основная льготная категория
    category = Column(Enum(BenefitCategory), nullable=False, index=True)
    
    # ЗАШИФРОВАННЫЕ КОНФИДЕНЦИАЛЬНЫЕ ДАННЫЕ (AES-256)
    encrypted_passport = Column(Text, nullable=True)              # Серия, номер, кем и когда выдан
    encrypted_snils = Column(Text, nullable=True)                 # СНИЛС
    encrypted_address = Column(Text, nullable=True)               # Адрес фактического проживания
    encrypted_document_details = Column(Text, nullable=True)      # Реквизиты удостоверения ветерана/справки
    
    # Дополнительные сведения
    children_count = Column(Integer, default=0, nullable=False)
    has_social_support = Column(Boolean, default=True, nullable=False)  # Получает ли меры господдержки
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("app.modules.curators.models.Student")
    user = relationship("app.modules.auth.models.User", foreign_keys=[user_id])
    family_members = relationship("DDMFamilyMember", back_populates="profile", cascade="all, delete-orphan")


class DDMFamilyMember(Base):
    __tablename__ = "ddm_family_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("ddm_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    full_name = Column(String(255), nullable=False)
    relation_type = Column(String(50), nullable=False)  # Сын, Дочь, Супруг(а), Мать, Отец
    birth_date = Column(Date, nullable=True)
    
    # Зашифрованные сведения о свидетельстве о рождении/паспорте
    encrypted_document_details = Column(Text, nullable=True)
    is_dependent = Column(Boolean, default=True, nullable=False)  # Находится ли на иждивении

    profile = relationship("DDMProfile", back_populates="family_members")


class DDMAuditLog(Base):
    __tablename__ = "ddm_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    officer_name = Column(String(255), nullable=False)
    
    action = Column(Enum(DDMAuditAction), nullable=False, index=True)
    target_record_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)