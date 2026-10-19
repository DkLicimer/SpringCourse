import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# --- СПРАВОЧНИКИ И ДИНАМИЧЕСКИЕ ПОЛЯ ---

class DirectoryItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool

    class Config:
        from_attributes = True


class DynamicFieldValueSubmit(BaseModel):
    field_id: uuid.UUID
    value: str


class DynamicFieldValueResponse(BaseModel):
    field_id: uuid.UUID
    field_label: Optional[str] = None
    field_name: Optional[str] = None
    field_type: Optional[str] = None
    value: str

    class Config:
        from_attributes = True


class DynamicFieldCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    label: str = Field(..., min_length=2, max_length=100)
    type: str = "text"
    is_required: bool = False


class DynamicFieldResponse(BaseModel):
    id: uuid.UUID
    name: str
    label: str
    type: str
    is_required: bool
    is_active: bool

    class Config:
        from_attributes = True


# --- СТУДЕНТЫ ---

class StudentCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    middle_name: Optional[str] = None
    is_union_member: bool = False
    social_category_ids: Optional[List[uuid.UUID]] = []
    organization_ids: Optional[List[uuid.UUID]] = []
    dynamic_values: Optional[List[DynamicFieldValueSubmit]] = []


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
    dynamic_values: List[DynamicFieldValueResponse] = []

    class Config:
        from_attributes = True


# --- НАЗНАЧЕНИЯ В ГРУППАХ ---

class AssignmentCreate(BaseModel):
    user_id: Optional[uuid.UUID] = None
    student_id: Optional[uuid.UUID] = None
    role_code: str  # CURATOR, STAROSTA, PROFORG, SENIOR_CURATOR
    protocol_number: Optional[str] = None
    protocol_date: Optional[datetime] = None
    protocol_file_url: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: Optional[str] = None
    role_code: str
    assigned_at: datetime
    unassigned_at: Optional[datetime] = None
    protocol_number: Optional[str] = None
    protocol_date: Optional[datetime] = None
    protocol_file_url: Optional[str] = None

    class Config:
        from_attributes = True


# --- ГРУППЫ ---

class GroupCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    faculty: str = Field(..., min_length=2, max_length=150)
    training_direction: Optional[str] = None
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


# --- ПОСЕЩАЕМОСТЬ ---

class QRScanRequest(BaseModel):
    qr_token: str


class AttendanceRecordResponse(BaseModel):
    student_id: uuid.UUID
    student_name: str
    is_present: bool
    marked_at: datetime
    method: str

    class Config:
        from_attributes = True


class AttendanceSessionCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    date: datetime = Field(default_factory=datetime.utcnow)


class AttendanceSessionResponse(BaseModel):
    id: uuid.UUID
    academic_group_id: uuid.UUID
    title: str
    date: datetime
    created_at: datetime
    records: List[AttendanceRecordResponse] = []

    class Config:
        from_attributes = True


class AttendanceBulkUpdate(BaseModel):
    student_id: uuid.UUID
    is_present: bool
    method: str = "manual"


# --- ЗАДАЧИ И ОТЧЕТЫ КУРАТОРОВ ---

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    category: str = "mandatory"
    type: str = "photo_proof"
    due_date: datetime
    points: int = 10
    confirmation_requirements: Optional[str] = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    category: str
    type: str
    due_date: datetime
    points: int
    confirmation_requirements: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TaskExecutionResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    curator_id: uuid.UUID
    curator_username: Optional[str] = None
    status: str
    photo_url: Optional[str] = None
    admin_comment: Optional[str] = None
    points_awarded: int
    task: Optional[TaskResponse] = None

    class Config:
        from_attributes = True


class TaskSubmit(BaseModel):
    photo_url: Optional[str] = None


class TaskReview(BaseModel):
    approve: bool
    comment: Optional[str] = None