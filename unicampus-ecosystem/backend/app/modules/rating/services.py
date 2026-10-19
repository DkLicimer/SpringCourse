from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from fastapi import HTTPException

from app.modules.rating.models import StudentAchievement, AchievementStatus, AchievementCategory, AchievementLevel
from app.modules.curators.models import Student, AcademicGroup
from app.modules.auth.models import User
from app.modules.rating import schemas

# Сетка баллов по умолчанию (согласно регламенту ПГАС)
POINTS_MATRIX = {
    AchievementLevel.UNIVERSITY: 10,
    AchievementLevel.REGIONAL: 25,
    AchievementLevel.ALL_RUSSIAN: 50,
    AchievementLevel.INTERNATIONAL: 100,
}


class RatingService:
    @staticmethod
    def calculate_default_points(level: AchievementLevel) -> int:
        return POINTS_MATRIX.get(level, 10)

    @classmethod
    def review_achievement(
        cls,
        db: Session,
        achievement_id: str,
        review_data: schemas.AchievementReview,
        reviewer_id
    ) -> StudentAchievement:
        achievement = db.query(StudentAchievement).filter(StudentAchievement.id == achievement_id).first()
        if not achievement:
            raise HTTPException(status_code=404, detail="Достижение не найдено")

        achievement.reviewer_id = reviewer_id
        achievement.reviewed_at = datetime.now(timezone.utc)
        achievement.reviewer_comment = review_data.comment

        if review_data.approve:
            achievement.status = AchievementStatus.APPROVED
            if review_data.points_awarded is not None:
                achievement.points_awarded = review_data.points_awarded
            else:
                achievement.points_awarded = cls.calculate_default_points(achievement.level)
        else:
            if not review_data.comment:
                raise HTTPException(status_code=400, detail="Укажите причину отклонения достижения")
            achievement.status = AchievementStatus.REJECTED
            achievement.points_awarded = 0

        db.commit()
        db.refresh(achievement)
        return achievement

    @staticmethod
    def get_leaderboard(
        db: Session,
        semester: Optional[str] = None,
        faculty: Optional[str] = None,
        course: Optional[int] = None
    ) -> List[schemas.LeaderboardItem]:
        """Формирование рейтингового списка студентов для стипендиальной комиссии"""
        query = db.query(
            Student.id.label("student_id"),
            Student.first_name,
            Student.last_name,
            Student.middle_name,
            AcademicGroup.name.label("group_name"),
            AcademicGroup.faculty.label("faculty"),
            AcademicGroup.course.label("course"),
            func.coalesce(func.sum(StudentAchievement.points_awarded), 0).label("total_points"),
            func.count(StudentAchievement.id).label("achievements_count")
        ).join(AcademicGroup, Student.academic_group_id == AcademicGroup.id)\
         .outerjoin(
             StudentAchievement,
             (StudentAchievement.student_id == Student.id) & 
             (StudentAchievement.status == AchievementStatus.APPROVED) &
             ((StudentAchievement.semester == semester) if semester else True)
         )

        if faculty:
            query = query.filter(AcademicGroup.faculty.ilike(f"%{faculty}%"))
        if course:
            query = query.filter(AcademicGroup.course == course)

        results = query.group_by(Student.id, AcademicGroup.id)\
                       .order_by(desc("total_points"), Student.last_name.asc())\
                       .all()

        leaderboard = []
        for index, row in enumerate(results, start=1):
            # Детализация баллов по категориям
            cats = db.query(
                StudentAchievement.category,
                func.coalesce(func.sum(StudentAchievement.points_awarded), 0)
            ).filter(
                StudentAchievement.student_id == row.student_id,
                StudentAchievement.status == AchievementStatus.APPROVED,
                ((StudentAchievement.semester == semester) if semester else True)
            ).group_by(StudentAchievement.category).all()
            
            cat_map = {c[0]: c[1] for c in cats}

            full_name = f"{row.last_name} {row.first_name} {row.middle_name or ''}".strip()
            leaderboard.append(schemas.LeaderboardItem(
                place=index,
                student_id=row.student_id,
                full_name=full_name,
                group_name=row.group_name,
                faculty=row.faculty,
                course=row.course,
                total_points=int(row.total_points),
                study_points=int(cat_map.get(AchievementCategory.STUDY, 0)),
                science_points=int(cat_map.get(AchievementCategory.SCIENCE, 0)),
                public_points=int(cat_map.get(AchievementCategory.PUBLIC, 0)),
                culture_points=int(cat_map.get(AchievementCategory.CULTURE, 0)),
                sport_points=int(cat_map.get(AchievementCategory.SPORT, 0)),
                achievements_count=row.achievements_count
            ))

        return leaderboard