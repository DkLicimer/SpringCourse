import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Table, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

# Связующая таблица Студенты <-> Социальные категории
student_social_categories = Table(
    "student_social_categories",
    Base.metadata,
    Column("student_id", UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("social_categories.id", ondelete="CASCADE"), primary_key=True)
)

# Связующая таблица Студенты <-> Студенческие организации
student_organizations_assoc = Table(
    "student_organizations_assoc",
    Base.metadata,
    Column("student_id", UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
    Column("organization_id", UUID(as_uuid=True), ForeignKey("student_organizations.id", ondelete="CASCADE"), primary_key=True)
)


class AcademicGroup(Base):
    __tablename__ = "academic_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    faculty = Column(String(150), nullable=False)
    training_direction = Column(String(150), nullable=True)
    course = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    students = relationship("Student", back_populates="group", cascade="all, delete-orphan")
    assignments = relationship("GroupAssignment", back_populates="group", cascade="all, delete-orphan")


class SocialCategory(Base):
    __tablename__ = "social_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class StudentOrganization(Base):
    __tablename__ = "student_organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class DynamicField(Base):
    __tablename__ = "dynamic_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    label = Column(String(100), nullable=False)
    type = Column(String(20), default="text", nullable=False)
    is_required = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    academic_group_id = Column(UUID(as_uuid=True), ForeignKey("academic_groups.id", ondelete="CASCADE"), nullable=False)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    is_union_member = Column(Boolean, default=False, nullable=False)
    qr_token = Column(String(64), unique=True, default=lambda: str(uuid.uuid4()), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    group = relationship("AcademicGroup", back_populates="students")
    user = relationship("app.modules.auth.models.User")
    social_categories = relationship("SocialCategory", secondary=student_social_categories)
    organizations = relationship("StudentOrganization", secondary=student_organizations_assoc)
    dynamic_values = relationship("StudentDynamicValue", back_populates="student", cascade="all, delete-orphan")


class StudentDynamicValue(Base):
    __tablename__ = "student_dynamic_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    field_id = Column(UUID(as_uuid=True), ForeignKey("dynamic_fields.id", ondelete="CASCADE"), nullable=False)
    value = Column(Text, nullable=False)

    student = relationship("Student", back_populates="dynamic_values")
    field = relationship("DynamicField")


class GroupAssignment(Base):
    __tablename__ = "group_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    academic_group_id = Column(UUID(as_uuid=True), ForeignKey("academic_groups.id", ondelete="CASCADE"), nullable=False)
    role_code = Column(String(30), nullable=False)  # CURATOR, STAROSTA, PROFORG, SENIOR_CURATOR
    
    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    unassigned_at = Column(DateTime(timezone=True), nullable=True)
    
    protocol_number = Column(String(50), nullable=True)
    protocol_date = Column(DateTime(timezone=True), nullable=True)
    protocol_file_url = Column(String(500), nullable=True)

    user = relationship("app.modules.auth.models.User")
    group = relationship("AcademicGroup", back_populates="assignments")


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    academic_group_id = Column(UUID(as_uuid=True), ForeignKey("academic_groups.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    group = relationship("AcademicGroup")
    records = relationship("AttendanceRecord", back_populates="session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    is_present = Column(Boolean, default=False, nullable=False)
    marked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    method = Column(String(20), default="manual", nullable=False)  # manual или qr

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(30), default="mandatory", nullable=False)  # mandatory / optional
    type = Column(String(30), default="photo_proof", nullable=False)    # photo_proof / no_proof
    due_date = Column(DateTime(timezone=True), nullable=False)
    points = Column(Integer, default=10, nullable=False)
    requirements = Column(Text, nullable=True)
    confirmation_requirements = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    executions = relationship("TaskExecution", back_populates="task", cascade="all, delete-orphan")


class TaskExecution(Base):
    __tablename__ = "task_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    curator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), default="NOT_STARTED", nullable=False)  # NOT_STARTED, PENDING, APPROVED, REVISION
    photo_url = Column(String(500), nullable=True)
    admin_comment = Column(Text, nullable=True)
    points_awarded = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    task = relationship("Task", back_populates="executions")
    curator = relationship("app.modules.auth.models.User")