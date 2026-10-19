import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field
from app.modules.dormitories.models import (
    RoomGenderPolicy, DormApplicationType, DormApplicationStatus, DormStayStatus
)


# --- ОБЩЕЖИТИЯ И КОМНАТЫ ---

class DormBedResponse(BaseModel):
    id: int
    bed_number: int
    is_occupied: bool
    current_student_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True


class DormRoomCreate(BaseModel):
    dormitory_id: int
    room_number: str = Field(..., min_length=1, max_length=20)
    floor: int = Field(..., ge=1, le=20)
    capacity_beds: int = Field(default=3, ge=1, le=8)
    gender_policy: RoomGenderPolicy = RoomGenderPolicy.ANY
    price_per_month: float = Field(default=1200.00, ge=0)


class DormRoomResponse(BaseModel):
    id: int
    dormitory_id: int
    room_number: str
    floor: int
    capacity_beds: int
    gender_policy: RoomGenderPolicy
    price_per_month: float
    is_active: bool
    beds: List[DormBedResponse] = []

    class Config:
        from_attributes = True


class DormitoryCreate(BaseModel):
    number: int = Field(..., ge=1)
    name: str = Field(..., min_length=2, max_length=150)
    address: str = Field(..., min_length=5, max_length=255)
    commandant_name: Optional[str] = None
    commandant_phone: Optional[str] = None


class DormitoryResponse(BaseModel):
    id: int
    number: int
    name: str
    address: str
    commandant_name: Optional[str] = None
    commandant_phone: Optional[str] = None
    is_active: bool
    total_beds: Optional[int] = 0
    free_beds: Optional[int] = 0

    class Config:
        from_attributes = True


# --- ЗАЯВЛЕНИЯ НА ПРОЖИВАНИЕ ---

class DormApplicationCreate(BaseModel):
    application_type: DormApplicationType = DormApplicationType.CHECK_IN
    preferred_dorm_id: Optional[int] = None
    priority_reason: Optional[str] = Field(None, description="Льготы: сирота, инвалидность, рейтинг ПГАС")
    comment: Optional[str] = None


class DormApplicationResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: Optional[str] = None
    group_name: Optional[str] = None
    application_type: DormApplicationType
    preferred_dorm_id: Optional[int] = None
    priority_reason: Optional[str] = None
    comment: Optional[str] = None
    status: DormApplicationStatus
    assigned_room_id: Optional[int] = None
    assigned_bed_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DormApplicationReview(BaseModel):
    approve: bool
    assigned_bed_id: Optional[int] = Field(None, description="ID койко-места (обязательно при одобрении)")
    rejection_reason: Optional[str] = Field(None, description="Причина отклонения заявления")


# --- СТАТИСТИКА ЖИЛОГО ФОНДА ---

class DormStatsResponse(BaseModel):
    total_dormitories: int
    total_rooms: int
    total_beds: int
    occupied_beds: int
    free_beds: int
    occupancy_rate_percent: float