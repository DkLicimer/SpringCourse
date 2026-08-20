import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# Связующая таблица многие-ко-многим между Мероприятиями и Академическими группами
event_groups = Table(
    "event_groups",
    Base.metadata,
    Column("event_id", UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", UUID(as_uuid=True), ForeignKey("academic_groups.id", ondelete="CASCADE"), primary_key=True)
)

# Связующая таблица между Студентами и Социальными категориями
student_social_categories = Table(
    "student_social_categories",
    Base.metadata,
    Column("student_id", UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("social_categories.id", ondelete="CASCADE"), primary_key=True)
)

# Связующая таблица между Студентами и Студенческими организациями
student_organizations_assoc = Table(
    "student_organizations_assoc",
    Base.metadata,
    Column("student_id", UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), primary_key=True),
    Column("organization_id", UUID(as_uuid=True), ForeignKey("student_organizations.id", ondelete="CASCADE"), primary_key=True)
)


# 1. Таблица Пользователей
class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    system_role = Column(String, default="USER", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    group_assignments = relationship("GroupAssignment", back_populates="user")
    student_profile = relationship("Student", back_populates="user", uselist=False)
    task_executions = relationship("TaskExecution", back_populates="curator")
    
    point_adjustments = relationship(
        "PointAdjustment", 
        foreign_keys="[PointAdjustment.curator_id]", 
        back_populates="curator"
    )
    disciplinary_marks = relationship(
        "DisciplinaryMark", 
        foreign_keys="[DisciplinaryMark.curator_id]", 
        back_populates="curator"
    )


# 2. Таблица Академических групп
class AcademicGroup(Base):
    __tablename__ = "academic_groups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False, index=True)
    faculty = Column(String, nullable=False)
    training_direction = Column(String, nullable=True)
    course = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    students = relationship("Student", back_populates="group", cascade="all, delete-orphan")
    assignments = relationship("GroupAssignment", back_populates="group")
    events = relationship("Event", secondary=event_groups, back_populates="groups")


# 3. Справочник Социальных категорий
class SocialCategory(Base):
    __tablename__ = "social_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


# 4. Справочник Студенческих организаций
class StudentOrganization(Base):
    __tablename__ = "student_organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


# 5. Таблица Студентов
class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    academic_group_id = Column(UUID(as_uuid=True), ForeignKey("academic_groups.id", ondelete="CASCADE"), nullable=False)
    
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    is_union_member = Column(Boolean, default=False, nullable=False)
    qr_token = Column(String, unique=True, default=lambda: str(uuid.uuid4()), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Отношения
    group = relationship("AcademicGroup", back_populates="students")
    user = relationship("User", back_populates="student_profile")
    social_categories = relationship("SocialCategory", secondary=student_social_categories)
    organizations = relationship("StudentOrganization", secondary=student_organizations_assoc)


# 6. Таблица назначений ответственных лиц на роли в группах
class GroupAssignment(Base):
    __tablename__ = "group_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    academic_group_id = Column(UUID(as_uuid=True), ForeignKey("academic_groups.id", ondelete="CASCADE"), nullable=False)
    role_code = Column(String, nullable=False) # CURATOR / STAROSTA / PROFORG
    
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    unassigned_at = Column(DateTime, nullable=True)
    
    protocol_number = Column(String, nullable=True)
    protocol_date = Column(DateTime, nullable=True)

    # Отношения
    user = relationship("User", back_populates="group_assignments")
    group = relationship("AcademicGroup", back_populates="assignments")


# 7. Таблица Задач
class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False) 
    type = Column(String, nullable=False) 
    due_date = Column(DateTime, nullable=False) 
    points = Column(Integer, default=0, nullable=False) 
    requirements = Column(String, nullable=True) 
    confirmation_requirements = Column(String, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)

    # Связи
    executions = relationship("TaskExecution", back_populates="task", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="associated_task")


# 8. Таблица Выполнения задач
class TaskExecution(Base):
    __tablename__ = "task_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    curator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="NOT_STARTED", nullable=False)
    photo_url = Column(String, nullable=True)
    admin_comment = Column(String, nullable=True)
    points_awarded = Column(Integer, default=0, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Отношения
    task = relationship("Task", back_populates="executions")
    curator = relationship("User", back_populates="task_executions")


# 9. Таблица Мероприятий
class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    date_time = Column(DateTime, nullable=False) 
    location = Column(String, nullable=False)    
    category = Column(String, nullable=False)    
    audience = Column(String, nullable=True)     
    is_mandatory = Column(Boolean, default=False, nullable=False)
    associated_task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Отношения
    associated_task = relationship("Task", back_populates="events")
    groups = relationship("AcademicGroup", secondary=event_groups, back_populates="events")


# 10. Корректировка баллов
class PointAdjustment(Base):
    __tablename__ = "point_adjustments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    points = Column(Integer, nullable=False) 
    reason = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    curator = relationship(
        "User", 
        foreign_keys=[curator_id], 
        back_populates="point_adjustments"
    )


# 11. Дисциплинарные отметки
class DisciplinaryMark(Base):
    __tablename__ = "disciplinary_marks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    curator = relationship(
        "User", 
        foreign_keys=[curator_id], 
        back_populates="disciplinary_marks"
    )


# 12. Анкеты / Опросы
class Survey(Base):
    __tablename__ = "surveys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_mandatory = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("SurveyQuestion", back_populates="survey", cascade="all, delete-orphan")


# 13. Вопросы в Анкете
class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    survey_id = Column(UUID(as_uuid=True), ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    type = Column(String, nullable=False)
    options = Column(String, nullable=True)

    survey = relationship("Survey", back_populates="questions")
    answers = relationship("SurveyAnswer", back_populates="question", cascade="all, delete-orphan")


# 14. Ответы кураторов на анкету
class SurveyAnswer(Base):
    __tablename__ = "survey_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("survey_questions.id", ondelete="CASCADE"), nullable=False)
    curator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    value = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("SurveyQuestion", back_populates="answers")
    curator = relationship("User")


# 15. Уведомления кураторов (Раздел 34 ТЗ)
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    curator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    text = Column(String, nullable=False)
    # Типы: task (задача), event (мероприятие), survey (анкета), review (проверка отчета), points (баллы)
    type = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    curator = relationship("User")