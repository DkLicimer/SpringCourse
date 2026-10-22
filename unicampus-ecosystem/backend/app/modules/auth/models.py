import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"                      # Студент
    STAFF = "STAFF"                          # Сотрудник / Преподаватель
    CURATOR = "CURATOR"                      # Куратор группы
    HEAD_CURATOR = "HEAD_CURATOR"            # Старший куратор института
    MODERATOR_SPACES = "MODERATOR_SPACES"    # Диспетчер бронирования залов
    MODERATOR_RATING = "MODERATOR_RATING"    # Проверяющий стипендиального рейтинга
    MODERATOR_DDM = "MODERATOR_DDM"          # Служебный модератор контура ДДМ
    ADMIN = "ADMIN"                          # Главный администратор платформы

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    
    # ФИО заявителя/пользователя для отображения в бронированиях и ведомостях
    full_name = Column(String(255), nullable=False)
    
    # Ролевая модель
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Флаг доступа к закрытому контуру ДДМ (152-ФЗ)
    is_ddm_officer = Column(Boolean, default=False, nullable=False)
    
    # Идентификатор для последующей интеграции с 1С («1С:Университет» / «1С:ЗУП»)
    external_1c_guid = Column(UUID(as_uuid=True), unique=True, nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<User {self.username} [{self.role.value}]>"