import uuid
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# --- СХЕМЫ ПОЛЬЗОВАТЕЛЕЙ (АУТЕНТИФИКАЦИЯ) ---

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    system_role: str = Field(default="USER")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    system_role: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    system_role: Optional[str] = None


# --- СХЕМЫ СПРАВОЧНИКОВ ---

class DirectoryItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class DirectoryItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool

    class Config:
        from_attributes = True


# --- СХЕМЫ НАЗНАЧЕНИЙ ОТВЕТСТВЕННЫХ ЛИЦ ---

class AssignmentCreate(BaseModel):
    user_id: uuid.UUID
    role_code: str
    protocol_number: Optional[str] = None
    protocol_date: Optional[datetime] = None

class AssignmentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: Optional[str] = None
    role_code: str
    assigned_at: datetime
    unassigned_at: Optional[datetime] = None
    protocol_number: Optional[str] = None
    protocol_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- СХЕМЫ СТУДЕНТОВ ---

class StudentCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    middle_name: Optional[str] = Field(None, max_length=100)
    is_union_member: bool = Field(default=False)
    social_category_ids: Optional[List[uuid.UUID]] = Field(default=[])
    organization_ids: Optional[List[uuid.UUID]] = Field(default=[])

class StudentResponse(BaseModel):
    id: uuid.UUID
    academic_group_id: uuid.UUID
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    is_union_member: bool
    qr_token: str
    user_id: Optional[uuid.UUID] = None
    social_categories: List[DirectoryItemResponse] = []
    organizations: List[DirectoryItemResponse] = []

    class Config:
        from_attributes = True


# --- СХЕМЫ АКАДЕМИЧЕСКИХ ГРУПП ---

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    faculty: str = Field(..., min_length=2, max_length=100)
    training_direction: Optional[str] = Field(None, max_length=150)
    course: int = Field(..., ge=1, le=6)

class GroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    faculty: str
    training_direction: Optional[str] = None
    course: int
    created_at: datetime

    class Config:
        from_attributes = True

class GroupDetailResponse(GroupResponse):
    students_count: int = 0
    curators: List[AssignmentResponse] = []
    starosta: Optional[AssignmentResponse] = None
    proforg: Optional[AssignmentResponse] = None

    class Config:
        from_attributes = True


# --- СХЕМЫ ЗАДАЧ (TASKS) ---

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    category: str
    type: str
    due_date: datetime
    points: int = Field(default=0, ge=0)
    requirements: Optional[str] = None
    confirmation_requirements: Optional[str] = None
    
    # Параметры таргетинга массового назначения (Раздел 37 ТЗ)
    target_type: str = Field(default="all")  # "all", "course", "faculty", "group"
    target_course: Optional[int] = Field(default=None, ge=1, le=6)
    target_faculty: Optional[str] = None
    target_group_ids: Optional[List[uuid.UUID]] = None

class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    category: str
    type: str
    due_date: datetime
    points: int
    requirements: Optional[str] = None
    confirmation_requirements: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- СХЕМЫ ВЫПОЛНЕНИЯ ЗАДАЧ ---

class TaskExecutionResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    curator_id: uuid.UUID
    status: str
    photo_url: Optional[str] = None
    admin_comment: Optional[str] = None
    points_awarded: int
    completed_at: Optional[datetime] = None
    updated_at: datetime
    task: Optional[TaskResponse] = None

    class Config:
        from_attributes = True

class TaskSubmit(BaseModel):
    photo_url: Optional[str] = None

class TaskReview(BaseModel):
    approve: bool
    comment: Optional[str] = None


# --- СХЕМЫ МЕРОПРИЯТИЙ (EVENTS) ---

class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    date_time: datetime
    location: str
    category: str
    audience: Optional[str] = None
    is_mandatory: bool = Field(default=False)
    associated_task_id: Optional[uuid.UUID] = None
    group_ids: List[uuid.UUID]

class EventResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    date_time: datetime
    location: str
    category: str
    audience: Optional[str] = None
    is_mandatory: bool
    associated_task_id: Optional[uuid.UUID] = None
    created_at: datetime
    groups: List[GroupResponse] = []

    class Config:
        from_attributes = True


# --- СХЕМА КАЛЕНДАРЯ ---

class CalendarItem(BaseModel):
    id: uuid.UUID
    type: str
    title: str
    date_time: datetime
    location: Optional[str] = None
    is_mandatory: bool
    associated_id: Optional[uuid.UUID] = None


# --- СХЕМЫ САНКЦИЙ И СИСТЕМЫ РЕЙТИНГА ---

class PointAdjustmentCreate(BaseModel):
    curator_id: uuid.UUID
    points: int
    reason: str

class PointAdjustmentResponse(BaseModel):
    id: uuid.UUID
    curator_id: uuid.UUID
    points: int
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True

class DisciplinaryMarkCreate(BaseModel):
    curator_id: uuid.UUID
    reason: str

class RatingItemResponse(BaseModel):
    place: int
    curator_id: uuid.UUID
    username: str
    points: int
    completion_percentage: int
    additional_points: int
    has_violation: bool
    violation_reason: Optional[str] = None


# --- СХЕМЫ АНКЕТ И ОПРОСОВ ---

class QuestionCreate(BaseModel):
    text: str
    type: str
    options: Optional[str] = None

class QuestionResponse(BaseModel):
    id: uuid.UUID
    text: str
    type: str
    options: Optional[str] = None

    class Config:
        from_attributes = True

class SurveyCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_mandatory: bool = False
    expires_at: datetime
    questions: List[QuestionCreate]

class SurveyResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    is_mandatory: bool
    expires_at: datetime
    created_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True

class AnswerSubmit(BaseModel):
    question_id: uuid.UUID
    value: str

class SurveySubmit(BaseModel):
    survey_id: uuid.UUID
    answers: List[AnswerSubmit]


# --- СХЕМЫ УВЕДОМЛЕНИЙ (NOTIFICATIONS) ---

class NotificationResponse(BaseModel):
    id: uuid.UUID
    curator_id: uuid.UUID
    text: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True