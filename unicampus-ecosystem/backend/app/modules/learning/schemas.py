import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.modules.learning.models import CourseTargetRole, EnrollmentStatus


# --- УРОКИ ---

class LessonCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    content_text: str = Field(..., min_length=5)
    video_url: Optional[str] = None
    attachment_url: Optional[str] = None
    order_index: int = 1


class LessonResponse(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    title: str
    content_text: str
    video_url: Optional[str] = None
    attachment_url: Optional[str] = None
    order_index: int

    class Config:
        from_attributes = True


# --- ТЕСТЫ И ВОПРОСЫ ---

class QuizOptionCreate(BaseModel):
    option_text: str = Field(..., min_length=1)
    is_correct: bool = False


class QuizOptionResponse(BaseModel):
    id: uuid.UUID
    option_text: str

    class Config:
        from_attributes = True


class QuizQuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=3)
    points: int = 1
    options: List[QuizOptionCreate] = []


class QuizQuestionResponse(BaseModel):
    id: uuid.UUID
    question_text: str
    points: int
    options: List[QuizOptionResponse] = []

    class Config:
        from_attributes = True


# --- КУРСЫ ---

class CourseCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    target_role: CourseTargetRole = CourseTargetRole.ALL
    is_mandatory: bool = False
    passing_score_percent: int = Field(default=80, ge=1, le=100)


class CourseResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    target_role: CourseTargetRole
    is_mandatory: bool
    passing_score_percent: int
    lessons_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class CourseDetailResponse(CourseResponse):
    lessons: List[LessonResponse] = []
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True


# --- ТЕСТИРОВАНИЕ И СЕРТИФИКАТЫ ---

class QuizAnswerSubmit(BaseModel):
    question_id: uuid.UUID
    selected_option_id: uuid.UUID


class QuizSubmit(BaseModel):
    answers: List[QuizAnswerSubmit]


class QuizResultResponse(BaseModel):
    total_questions: int
    correct_answers: int
    score_percent: int
    is_passed: bool
    status: EnrollmentStatus
    certificate_number: Optional[str] = None


class EnrollmentResponse(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    course_title: str
    status: EnrollmentStatus
    progress_percent: int
    quiz_score_percent: int
    certificate_number: Optional[str] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True