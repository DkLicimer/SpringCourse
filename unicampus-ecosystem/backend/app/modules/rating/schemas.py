import uuid
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field
from app.modules.rating.models import AchievementCategory, AchievementLevel, AchievementStatus


class AchievementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    category: AchievementCategory
    level: AchievementLevel = AchievementLevel.UNIVERSITY
    event_date: date
    proof_file_url: str = Field(..., description="URL загруженного скана документа")
    semester: str = Field(default="2026-1", description="Семестр подачи")


class AchievementResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: Optional[str] = None
    group_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    category: AchievementCategory
    level: AchievementLevel
    event_date: date
    proof_file_url: str
    status: AchievementStatus
    points_awarded: int
    semester: str
    reviewer_comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AchievementReview(BaseModel):
    approve: bool
    points_awarded: Optional[int] = Field(None, ge=0, description="Если не указано, баллы рассчитаются автоматически")
    comment: Optional[str] = Field(None, description="Обязательно при отклонении")


class LeaderboardItem(BaseModel):
    place: int
    student_id: uuid.UUID
    full_name: str
    group_name: str
    faculty: str
    course: int
    total_points: int
    study_points: int
    science_points: int
    public_points: int
    culture_points: int
    sport_points: int
    achievements_count: int