import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.modules.learning.models import (
    Course, CourseLesson, QuizQuestion, QuizOption, 
    CourseEnrollment, EnrollmentStatus
)
from app.modules.learning import schemas


class LearningService:
    @staticmethod
    def enroll_user_to_course(db: Session, course_id: uuid.UUID, user_id: uuid.UUID) -> CourseEnrollment:
        """Запись пользователя на курс (создание прогресса)"""
        course = db.query(Course).filter(Course.id == course_id, Course.is_active == True).first()
        if not course:
            raise HTTPException(status_code=404, detail="Курс не найден")

        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.user_id == user_id
        ).first()

        if not enrollment:
            enrollment = CourseEnrollment(
                user_id=user_id,
                course_id=course_id,
                status=EnrollmentStatus.IN_PROGRESS,
                progress_percent=0
            )
            db.add(enrollment)
            db.commit()
            db.refresh(enrollment)

        return enrollment

    @classmethod
    def evaluate_quiz(
        cls,
        db: Session,
        course_id: uuid.UUID,
        user_id: uuid.UUID,
        submission: schemas.QuizSubmit
    ) -> schemas.QuizResultResponse:
        """Проверка ответов и генерация электронного сертификата при успехе"""
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Курс не найден")

        questions = db.query(QuizQuestion).filter(QuizQuestion.course_id == course_id).all()
        if not questions:
            raise HTTPException(status_code=400, detail="В данном курсе нет проверочных вопросов")

        total_questions = len(questions)
        correct_count = 0

        # Собираем правильные ответы
        for ans in submission.answers:
            opt = db.query(QuizOption).filter(
                QuizOption.id == ans.selected_option_id,
                QuizOption.question_id == ans.question_id
            ).first()
            if opt and opt.is_correct:
                correct_count += 1

        score_pct = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
        is_passed = score_pct >= course.passing_score_percent

        enrollment = cls.enroll_user_to_course(db, course_id, user_id)
        enrollment.quiz_score_percent = score_pct
        enrollment.progress_percent = 100

        cert_number = None
        if is_passed:
            enrollment.status = EnrollmentStatus.COMPLETED
            enrollment.completed_at = datetime.now(timezone.utc)
            cert_number = f"CERT-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            enrollment.certificate_number = cert_number
        else:
            enrollment.status = EnrollmentStatus.FAILED

        db.commit()

        return schemas.QuizResultResponse(
            total_questions=total_questions,
            correct_answers=correct_count,
            score_percent=score_pct,
            is_passed=is_passed,
            status=enrollment.status,
            certificate_number=cert_number
        )