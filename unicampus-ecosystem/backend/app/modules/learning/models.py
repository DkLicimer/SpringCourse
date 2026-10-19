import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Boolean, ForeignKey, 
    DateTime, Text, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class CourseTargetRole(str, enum.Enum):
    ALL = "ALL"              # Доступен всем
    STUDENT = "STUDENT"      # Для студентов (адаптационные курсы)
    CURATOR = "CURATOR"      # Для кураторов (инструктажи, методика)
    STAFF = "STAFF"          # Для преподавателей и персонала


class EnrollmentStatus(str, enum.Enum):
    IN_PROGRESS = "IN_PROGRESS"  # В процессе изучения
    COMPLETED = "COMPLETED"      # Успешно завершен (тест сдан)
    FAILED = "FAILED"            # Тест не сдан


class Course(Base):
    __tablename__ = "learning_courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    
    target_role = Column(Enum(CourseTargetRole), default=CourseTargetRole.ALL, nullable=False)
    is_mandatory = Column(Boolean, default=False, nullable=False)
    passing_score_percent = Column(Integer, default=80, nullable=False)  # Проходной балл (например, 80%)
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    lessons = relationship("CourseLesson", back_populates="course", cascade="all, delete-orphan", order_by="CourseLesson.order_index")
    questions = relationship("QuizQuestion", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")


class CourseLesson(Base):
    __tablename__ = "learning_lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("learning_courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    content_text = Column(Text, nullable=False)
    video_url = Column(String(500), nullable=True)
    attachment_url = Column(String(500), nullable=True)
    order_index = Column(Integer, default=1, nullable=False)

    course = relationship("Course", back_populates="lessons")


class QuizQuestion(Base):
    __tablename__ = "learning_quiz_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("learning_courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    question_text = Column(Text, nullable=False)
    points = Column(Integer, default=1, nullable=False)

    course = relationship("Course", back_populates="questions")
    options = relationship("QuizOption", back_populates="question", cascade="all, delete-orphan")


class QuizOption(Base):
    __tablename__ = "learning_quiz_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("learning_quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    option_text = Column(String(255), nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)

    question = relationship("QuizQuestion", back_populates="options")


class CourseEnrollment(Base):
    __tablename__ = "learning_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("learning_courses.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.IN_PROGRESS, nullable=False)
    progress_percent = Column(Integer, default=0, nullable=False)
    quiz_score_percent = Column(Integer, default=0, nullable=False)
    
    # Номер электронного сертификата при успешной сдаче
    certificate_number = Column(String(50), unique=True, nullable=True, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("app.modules.auth.models.User")
    course = relationship("Course", back_populates="enrollments")