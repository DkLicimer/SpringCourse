import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.curators.models import AcademicGroup
from app.modules.calendar.models import UniversityEvent
from app.modules.calendar import schemas
from app.modules.calendar.services import CalendarService

router = APIRouter(prefix="/calendar", tags=["4. Единый календарный план мероприятий"])


@router.get("/grid", response_model=List[schemas.CalendarGridItem])
def get_calendar_grid(
    start_date: datetime = Query(..., description="Начало интервала в формате ISO (YYYY-MM-DDTHH:MM:SS)"),
    end_date: datetime = Query(..., description="Конец интервала в формате ISO (YYYY-MM-DDTHH:MM:SS)"),
    course: Optional[int] = Query(None, ge=1, le=6, description="Фильтр по курсу"),
    faculty: Optional[str] = Query(None, description="Фильтр по факультету"),
    db: Session = Depends(get_db)
):
    """
    Сквозная сетка расписания университета:
    возвращает в едином формате мероприятия, занятость аудиторий и дедлайны задач.
    """
    return CalendarService.get_unified_grid(db, start_date, end_date, course, faculty)


@router.post("/events", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: schemas.EventCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.HEAD_CURATOR]))
):
    """
    Внесение нового университетского мероприятия в план (для администраторов и старших кураторов).
    """
    new_event = UniversityEvent(
        title=event_in.title.strip(),
        description=event_in.description,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        location=event_in.location.strip(),
        category=event_in.category,
        is_mandatory=event_in.is_mandatory,
        target_type=event_in.target_type,
        target_course=event_in.target_course,
        target_faculty=event_in.target_faculty,
        room_id=event_in.room_id,
        associated_task_id=event_in.associated_task_id,
        creator_id=admin.id
    )

    if event_in.target_group_ids:
        groups = db.query(AcademicGroup).filter(AcademicGroup.id.in_(event_in.target_group_ids)).all()
        new_event.target_groups = groups

    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.delete("/events/{event_id}")
def delete_event(
    event_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Удаление мероприятия из календарного плана"""
    event = db.query(UniversityEvent).filter(UniversityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Мероприятие не найдено")

    db.delete(event)
    db.commit()
    return {"message": "Мероприятие успешно удалено из плана"}