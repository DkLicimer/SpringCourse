import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field
from app.modules.ddm.models import BenefitCategory, DDMAuditAction


# --- ЧЛЕНЫ СЕМЬИ ---

class FamilyMemberCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    relation_type: str = Field(..., description="Сын / Дочь / Супруг(а)")
    birth_date: Optional[date] = None
    document_details: Optional[str] = Field(None, description="Свидетельство о рождении / Паспорт")
    is_dependent: bool = True


class FamilyMemberResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    relation_type: str
    birth_date: Optional[date] = None
    document_details: Optional[str] = None
    is_dependent: bool

    class Config:
        from_attributes = True


# --- АНКЕТА ЛЬГОТНИКА (ДДМ) ---

class DDMProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    birth_date: date
    phone: Optional[str] = None
    category: BenefitCategory
    
    # Поля, которые автоматически зашифруются AES-256
    passport_data: Optional[str] = Field(None, description="Паспортные данные")
    snils: Optional[str] = Field(None, description="СНИЛС")
    residential_address: Optional[str] = Field(None, description="Адрес проживания")
    document_details: Optional[str] = Field(None, description="Удостоверение ветерана / Справка многодетной")
    
    children_count: int = Field(default=0, ge=0)
    has_social_support: bool = True
    notes: Optional[str] = None
    student_id: Optional[uuid.UUID] = None
    family_members: List[FamilyMemberCreate] = []


class DDMProfileListItem(BaseModel):
    """Маскированная карточка для общего списка (без раскрытия паспортных данных)"""
    id: uuid.UUID
    full_name: str
    birth_date: date
    phone: Optional[str] = None
    category: BenefitCategory
    children_count: int
    has_social_support: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DDMProfileDetail(BaseModel):
    """Полная расшифрованная карточка для уполномоченного лица"""
    id: uuid.UUID
    full_name: str
    birth_date: date
    phone: Optional[str] = None
    category: BenefitCategory
    
    # Расшифрованные поля
    passport_data: Optional[str] = None
    snils: Optional[str] = None
    residential_address: Optional[str] = None
    document_details: Optional[str] = None
    
    children_count: int
    has_social_support: bool
    notes: Optional[str] = None
    student_id: Optional[uuid.UUID] = None
    created_at: datetime
    family_members: List[FamilyMemberResponse] = []

    class Config:
        from_attributes = True


# --- АУДИТ ЖУРНАЛА ---

class DDMAuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    officer_name: str
    action: DDMAuditAction
    target_record_id: Optional[uuid.UUID] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True