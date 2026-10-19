import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.modules.auth.models import UserRole

class UserLogin(BaseModel):
    username_or_email: str = Field(..., description="Логин или e-mail пользователя")
    password: str = Field(..., description="Пароль")

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    full_name: str
    is_ddm_officer: bool

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.STUDENT
    is_ddm_officer: bool = False
    external_1c_guid: Optional[uuid.UUID] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: Optional[str]
    phone: Optional[str]
    full_name: str
    role: UserRole
    is_active: bool
    is_ddm_officer: bool
    external_1c_guid: Optional[uuid.UUID]
    created_at: datetime

    class Config:
        from_attributes = True