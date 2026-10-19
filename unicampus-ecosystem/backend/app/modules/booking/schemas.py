import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.modules.booking.models import (
    SpaceBookingStatus, CabinCategory, RecreationBookingStatus, 
    RecreationUserRole, GuestCategory
)


# --- СХЕМЫ ПРОСТРАНСТВ ---

class RoomResponse(BaseModel):
    id: int
    name: str
    address: str
    capacity_seats: int
    amenities: List[str]
    image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class SpaceScheduleSlot(BaseModel):
    id: int
    event_name: str
    start_time: datetime
    end_time: datetime
    status: SpaceBookingStatus

    class Config:
        from_attributes = True


class SpaceBookingCreate(BaseModel):
    room_id: int
    event_name: str = Field(..., min_length=3, max_length=255)
    start_time: datetime
    end_time: datetime
    sound_engineer_required: bool = False
    applicant_full_name: str
    applicant_position: str
    applicant_email: EmailStr
    applicant_phone: str


class SpaceBookingResponse(BaseModel):
    id: int
    room_id: int
    event_name: str
    start_time: datetime
    end_time: datetime
    status: SpaceBookingStatus
    sound_engineer_required: bool
    applicant_full_name: str
    applicant_email: str
    created_at: datetime

    class Config:
        from_attributes = True


class SpaceBookingStatusUpdate(BaseModel):
    status: SpaceBookingStatus
    rejection_reason: Optional[str] = None


# --- СХЕМЫ БАЗЫ ОТДЫХА ---

class CabinResponse(BaseModel):
    id: int
    number: int
    title: Optional[str]
    category: CabinCategory
    capacity: int
    price_staff_full_cabin: float
    price_student_bed: float
    map_x: float
    map_y: float
    description: Optional[str]
    is_available: Optional[bool] = True

    class Config:
        from_attributes = True


class GuestCreate(BaseModel):
    full_name: str
    category: GuestCategory = GuestCategory.ADULT
    document_info: Optional[str] = None
    birth_date: Optional[date] = None


class RecreationBookingCreate(BaseModel):
    cabin_id: int
    user_role: RecreationUserRole
    start_date: date
    end_date: date
    contact_name: str
    contact_phone: str
    contact_email: EmailStr
    guests: List[GuestCreate] = []


class RecreationBookingResponse(BaseModel):
    id: uuid.UUID
    booking_number: str
    cabin_id: int
    user_role: RecreationUserRole
    start_date: date
    end_date: date
    total_price: float
    contact_name: str
    contact_phone: str
    contact_email: str
    status: RecreationBookingStatus
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True