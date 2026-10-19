from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.modules.calendar.models import UniversityEvent, EventCategory
from app.modules.booking.models import SpaceBooking, SpaceBookingStatus, Room
from app.modules.curators.models import Task
from app.modules.calendar import schemas


class CalendarService:
    @staticmethod
    def get_unified_grid(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        course: Optional[int] = None,
        faculty: Optional[str] = None
    ) -> List[schemas.CalendarGridItem]:
        """
        Собирает сквозную сетку событий университета за период:
        1. Мероприятия университета
        2. Одобренные бронирования аудиторий (занятость залов)
        3. Дедлайны по поручениям и отчетам кураторов
        """
        items: List[schemas.CalendarGridItem] = []

        # 1. Университетские мероприятия
        event_query = db.query(UniversityEvent).filter(
            UniversityEvent.start_time <= end_date,
            or_(
                UniversityEvent.end_time.is_(None),
                UniversityEvent.end_time >= start_date
            )
        )
        if course:
            event_query = event_query.filter(
                or_(UniversityEvent.target_course.is_(None), UniversityEvent.target_course == course)
            )
        if faculty:
            event_query = event_query.filter(
                or_(UniversityEvent.target_faculty.is_(None), UniversityEvent.target_faculty.ilike(f"%{faculty}%"))
            )

        for ev in event_query.all():
            badge = "#EF4444" if ev.is_mandatory else "#F97316"  # Красный или оранжевый маркер
            items.append(schemas.CalendarGridItem(
                id=f"event_{ev.id}",
                item_type="EVENT",
                title=ev.title,
                description=ev.description,
                start_time=ev.start_time,
                end_time=ev.end_time or ev.start_time,
                location=ev.location,
                is_mandatory=ev.is_mandatory,
                category=ev.category.value,
                badge_color=badge
            ))

        # 2. Одобренные бронирования аудиторий
        space_bookings = db.query(SpaceBooking).join(Room).filter(
            SpaceBooking.status == SpaceBookingStatus.APPROVED,
            SpaceBooking.start_time <= end_date,
            SpaceBooking.end_time >= start_date
        ).all()

        for sb in space_bookings:
            items.append(schemas.CalendarGridItem(
                id=f"booking_{sb.id}",
                item_type="SPACE_BOOKING",
                title=f"Занято: {sb.room.name} — {sb.event_name}",
                description=f"Организатор: {sb.applicant_full_name} ({sb.applicant_position})",
                start_time=sb.start_time,
                end_time=sb.end_time,
                location=f"{sb.room.name} ({sb.room.address})",
                is_mandatory=False,
                category="Бронирование помещений",
                badge_color="#3B82F6"  # Синий маркер аудиторий
            ))

        # 3. Дедлайны кураторских задач
        tasks = db.query(Task).filter(
            Task.due_date >= start_date,
            Task.due_date <= end_date
        ).all()

        for t in tasks:
            items.append(schemas.CalendarGridItem(
                id=f"task_{t.id}",
                item_type="TASK_DEADLINE",
                title=f"Дедлайн отчета: {t.title}",
                description=t.description,
                start_time=t.due_date,
                end_time=t.due_date,
                location="Электронный кабинет",
                is_mandatory=t.category == "mandatory",
                category="Срок сдачи отчета",
                badge_color="#10B981"  # Изумрудный маркер задач
            ))

        # Сортировка по времени начала
        items.sort(key=lambda x: x.start_time)
        return items