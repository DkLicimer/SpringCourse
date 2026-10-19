import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.modules.calendar.models import EventCategory, TargetAudienceType


class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    location: str = Field(..., min_length=2, max_length=255)
    category: EventCategory = EventCategory.EDUCATIONAL
    is_mandatory: bool = False
    
    target_type: TargetAudienceType = TargetAudienceType.ALL
    target_course: Optional[int] = Field(None, ge=1, le=6)
    target_faculty: Optional[str] = None
    target_group_ids: Optional[List[uuid.UUID]] = []

    room_id: Optional[int] = None
    associated_task_id: Optional[uuid.UUID] = None


class EventResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    location: str
    category: EventCategory
    is_mandatory: bool
    target_type: TargetAudienceType
    target_course: Optional[int] = None
    target_faculty: Optional[str] = None
    room_id: Optional[int] = None
    associated_task_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CalendarGridItem(BaseModel):
    """
    Универсальный элемент единой сетки календаря.
    Объединяет мероприятия, бронирования залов и дедлайны задач.
    """
    id: str
    item_type: str  # "EVENT", "SPACE_BOOKING", "TASK_DEADLINE"
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_mandatory: bool = False
    category: str
    badge_color: str  # HEX или Tailwind-класс для фронтенда