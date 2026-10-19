import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.learning.models import Course, CourseLesson, QuizQuestion, QuizOption, CourseEnrollment
from app.modules.learning import schemas
from app.modules.learning.services import LearningService

router = APIRouter(prefix="/learning", tags=["9. Обучение и онлайн-курсы (LMS)"])


@router.get("/courses", response_model=List[schemas.CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    """Каталог активных курсов и инструктажей"""
    courses = db.query(Course).filter(Course.is_active == True).all()
    results = []
    for c in courses:
        res = schemas.CourseResponse.model_validate(c)
        res.lessons_count = len(c.lessons)
        results.append(res)
    return results


@router.get("/courses/{course_id}", response_model=schemas.CourseDetailResponse)
def get_course_detail(course_id: uuid.UUID, db: Session = Depends(get_db)):
    """Программа курса, уроки и проверочные вопросы (без спойлера верных ответов)"""
    course = db.query(Course).filter(Course.id == course_id, Course.is_active == True).first()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")

    res = schemas.CourseDetailResponse.model_validate(course)
    res.lessons_count = len(course.lessons)
    return res


@router.post("/courses", response_model=schemas.CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    payload: schemas.CourseCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HEAD_CURATOR]))
):
    """Создание нового обучающего курса (для администраторов)"""
    course = Course(**payload.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.post("/courses/{course_id}/lessons", response_model=schemas.LessonResponse, status_code=status.HTTP_201_CREATED)
def add_lesson(
    course_id: uuid.UUID,
    payload: schemas.LessonCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HEAD_CURATOR]))
):
    """Добавление урока/темы в курс"""
    lesson = CourseLesson(course_id=course_id, **payload.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.post("/courses/{course_id}/questions", response_model=schemas.QuizQuestionResponse, status_code=status.HTTP_201_CREATED)
def add_quiz_question(
    course_id: uuid.UUID,
    payload: schemas.QuizQuestionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HEAD_CURATOR]))
):
    """Добавление проверочного вопроса с вариантами ответов"""
    q = QuizQuestion(course_id=course_id, question_text=payload.question_text, points=payload.points)
    db.add(q)
    db.commit()
    db.refresh(q)

    for opt in payload.options:
        db.add(QuizOption(question_id=q.id, option_text=opt.option_text, is_correct=opt.is_correct))
    db.commit()
    db.refresh(q)
    return q


@router.post("/courses/{course_id}/quiz/submit", response_model=schemas.QuizResultResponse)
def submit_quiz(
    course_id: uuid.UUID,
    submission: schemas.QuizSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Сдача проверочного теста студентом/куратором и выдача сертификата"""
    return LearningService.evaluate_quiz(db, course_id, current_user.id, submission)


@router.get("/my-enrollments", response_model=List[schemas.EnrollmentResponse])
def get_my_learning_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Мои курсы, статус прохождения и номера полученных сертификатов"""
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.user_id == current_user.id
    ).order_by(CourseEnrollment.created_at.desc()).all()

    results = []
    for e in enrollments:
        results.append(schemas.EnrollmentResponse(
            id=e.id,
            course_id=e.course_id,
            course_title=e.course.title if e.course else "—",
            status=e.status,
            progress_percent=e.progress_percent,
            quiz_score_percent=e.quiz_score_percent,
            certificate_number=e.certificate_number,
            completed_at=e.completed_at
        ))
    return results