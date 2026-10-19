import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from ..database import get_db
from .. import models, schemas, auth
from .notifications import add_notification 

router = APIRouter(
    prefix="/tasks",
    tags=["Задачи, Мероприятия и Календарь"]
)

# 1. Создание задачи Администратором
@router.post("/", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    task_data = task_in.model_dump()
    target_type = task_data.pop("target_type", "all")
    target_course = task_data.pop("target_course", None)
    target_faculty = task_data.pop("target_faculty", None)
    target_group_ids = task_data.pop("target_group_ids", None)

    new_task = models.Task(
        **task_data,
        target_type=target_type,
        target_course=target_course,
        target_faculty=target_faculty
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    group_query = db.query(models.AcademicGroup)
    if target_type == "course" and target_course is not None:
        group_query = group_query.filter(models.AcademicGroup.course == target_course)
    elif target_type == "faculty" and target_faculty:
        group_query = group_query.filter(models.AcademicGroup.faculty.ilike(target_faculty.strip()))
    elif target_type == "group" and target_group_ids:
        group_query = group_query.filter(models.AcademicGroup.id.in_(target_group_ids))
    
    targeted_groups = group_query.all()
    targeted_group_ids = [g.id for g in targeted_groups]

    if targeted_group_ids:
        curators = db.query(models.User).join(models.GroupAssignment).filter(
            models.GroupAssignment.academic_group_id.in_(targeted_group_ids),
            models.GroupAssignment.role_code.in_(["CURATOR", "SENIOR_CURATOR"]),
            models.GroupAssignment.unassigned_at.is_(None)
        ).distinct().all()

        for curator in curators:
            execution = models.TaskExecution(
                task_id=new_task.id,
                curator_id=curator.id,
                status="NOT_STARTED"
            )
            db.add(execution)
            
            add_notification(
                db, 
                curator_id=curator.id, 
                text=f"Вам назначена новая задача: '{new_task.title}' с дедлайном до {new_task.due_date.strftime('%d.%m.%Y %H:%M')}", 
                n_type="task"
            )
            
        db.commit()

    return new_task


# 2. Получение своего списка задач
@router.get("/my-tasks", response_model=List[schemas.TaskExecutionResponse])
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    executions = db.query(models.TaskExecution).filter(
        models.TaskExecution.curator_id == current_user.id
    ).all()
    
    for exe in executions:
        exe.task = db.query(models.Task).filter(models.Task.id == exe.task_id).first()
        
    return executions


# 3. Отправка отчета куратором
@router.post("/my-tasks/{execution_id}/submit", response_model=schemas.TaskExecutionResponse)
def submit_task_completion(
    execution_id: uuid.UUID,
    submit_in: schemas.TaskSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    execution = db.query(models.TaskExecution).filter(
        models.TaskExecution.id == execution_id,
        models.TaskExecution.curator_id == current_user.id
    ).first()

    if not execution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись выполнения задачи не найдена")

    task = db.query(models.Task).filter(models.Task.id == execution.task_id).first()

    if task.type == "photo_proof" and not submit_in.photo_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Требуется файл фотоотчета или документ"
        )

    if task.type == "no_proof":
        execution.status = "APPROVED"
        execution.points_awarded = task.points
        execution.completed_at = datetime.utcnow()
    else:
        execution.status = "PENDING"
        execution.photo_url = submit_in.photo_url

    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    execution.task = task
    return execution


# 4. Проверка отчетов кураторов
@router.post("/executions/{execution_id}/review", response_model=schemas.TaskExecutionResponse)
def review_task_execution(
    execution_id: uuid.UUID,
    review_in: schemas.TaskReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    execution = db.query(models.TaskExecution).filter(models.TaskExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись выполнения не найдена")

    task = db.query(models.Task).filter(models.Task.id == execution.task_id).first()

    if review_in.approve:
        execution.status = "APPROVED"
        execution.points_awarded = task.points
        execution.admin_comment = None
        execution.completed_at = datetime.utcnow()
        
        add_notification(
            db,
            curator_id=execution.curator_id,
            text=f"Ваш отчет по задаче '{task.title}' успешно ОДОБРЕН. Начислено {task.points} баллов!",
            n_type="review"
        )
    else:
        if not review_in.comment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Необходим комментарий с причиной возврата"
            )
        execution.status = "REVISION"
        execution.admin_comment = review_in.comment

        add_notification(
            db,
            curator_id=execution.curator_id,
            text=f"Ваш отчет по задаче '{task.title}' ОТКЛОНЕН и возвращен на доработку. Замечание: {review_in.comment}",
            n_type="review"
        )

    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    execution.task = task
    return execution


# 5. Создание мероприятия (с поддержкой диапазона дат)
@router.post("/events", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    groups = db.query(models.AcademicGroup).filter(models.AcademicGroup.id.in_(event_in.group_ids)).all()
    if len(groups) != len(event_in.group_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Группы не найдены")

    new_event = models.Event(
        title=event_in.title,
        description=event_in.description,
        date_time=event_in.date_time,
        end_date_time=event_in.end_date_time,
        location=event_in.location,
        category=event_in.category,
        audience=event_in.audience,
        is_mandatory=event_in.is_mandatory,
        associated_task_id=event_in.associated_task_id
    )
    new_event.groups = groups
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    curators = db.query(models.User).join(models.GroupAssignment).filter(
        models.GroupAssignment.academic_group_id.in_(event_in.group_ids),
        models.GroupAssignment.role_code.in_(["CURATOR", "SENIOR_CURATOR"]),
        models.GroupAssignment.unassigned_at.is_(None)
    ).distinct().all()

    for curator in curators:
        add_notification(
            db,
            curator_id=curator.id,
            text=f"Для вашей группы опубликовано новое мероприятие: '{new_event.title}' ({new_event.date_time.strftime('%d.%m в %H:%M')})",
            n_type="event"
        )

    return new_event


# 6. Получение календаря с поддержкой многодневных событий
@router.get("/my-calendar", response_model=List[schemas.CalendarItem])
def get_my_calendar(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    calendar_items = []

    if current_user.system_role in ["ADMIN", "SENIOR_CURATOR"]:
        events = db.query(models.Event).all()
        tasks = db.query(models.Task).all()
    else:
        assigned_group_ids = db.query(models.GroupAssignment.academic_group_id).filter(
            models.GroupAssignment.user_id == current_user.id,
            models.GroupAssignment.unassigned_at.is_(None)
        ).all()
        group_ids = [g[0] for g in assigned_group_ids]

        events = db.query(models.Event).join(models.Event.groups).filter(
            models.AcademicGroup.id.in_(group_ids)
        ).all()

        tasks_executions = db.query(models.TaskExecution).filter(
            models.TaskExecution.curator_id == current_user.id
        ).all()
        tasks = [db.query(models.Task).filter(models.Task.id == exe.task_id).first() for exe in tasks_executions]

    for event in events:
        calendar_items.append(
            schemas.CalendarItem(
                id=event.id,
                type="event",
                title=event.title,
                date_time=event.date_time,
                end_date_time=event.end_date_time,
                location=event.location,
                is_mandatory=event.is_mandatory,
                associated_id=event.associated_task_id
            )
        )

    for task in tasks:
        if task:
            calendar_items.append(
                schemas.CalendarItem(
                    id=task.id,
                    type="task_deadline",
                    title=f"Дедлайн: {task.title}",
                    date_time=task.due_date,
                    end_date_time=None,
                    location="Платформа (онлайн)",
                    is_mandatory=task.category == "mandatory",
                    associated_id=None
                )
            )

    calendar_items.sort(key=lambda x: x.date_time)
    return calendar_items


# 7. Список всех выполнений
@router.get("/executions", response_model=List[schemas.TaskExecutionResponse])
def get_all_executions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    executions = db.query(models.TaskExecution).all()
    for exe in executions:
        exe.task = db.query(models.Task).filter(models.Task.id == exe.task_id).first()
        curator = db.query(models.User).filter(models.User.id == exe.curator_id).first()
        exe.curator_username = curator.username if curator else "Неизвестный куратор"
        
        assignment = db.query(models.GroupAssignment).filter(
            models.GroupAssignment.user_id == exe.curator_id,
            models.GroupAssignment.unassigned_at.is_(None)
        ).first()
        if assignment:
            grp = db.query(models.AcademicGroup).filter(models.AcademicGroup.id == assignment.academic_group_id).first()
            exe.group_name = grp.name if grp else "—"
        else:
            exe.group_name = "—"
            
    return executions