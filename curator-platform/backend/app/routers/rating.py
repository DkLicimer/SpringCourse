import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from ..database import get_db
from .. import models, schemas, auth
from .notifications import add_notification

router = APIRouter(
    prefix="/rating",
    tags=["Рейтинг и Санкции"]
)

@router.get("/", response_model=List[schemas.RatingItemResponse])
def get_curators_rating(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    curators = db.query(models.User).join(models.GroupAssignment).filter(
        models.GroupAssignment.role_code == "CURATOR",
        models.GroupAssignment.unassigned_at.is_(None)
    ).distinct().all()

    rating_list = []
    total_mandatory = db.query(models.Task).filter(models.Task.category == "mandatory").count()

    for curator in curators:
        task_points = db.query(func.sum(models.TaskExecution.points_awarded)).filter(
            models.TaskExecution.curator_id == curator.id,
            models.TaskExecution.status == "APPROVED"
        ).scalar() or 0

        additional_points = db.query(func.sum(models.PointAdjustment.points)).filter(
            models.PointAdjustment.curator_id == curator.id
        ).scalar() or 0

        total_points = task_points + additional_points

        approved_mandatory = db.query(models.TaskExecution).join(models.Task).filter(
            models.TaskExecution.curator_id == curator.id,
            models.TaskExecution.status == "APPROVED",
            models.Task.category == "mandatory"
        ).count()

        completion_pct = (approved_mandatory / total_mandatory * 100) if total_mandatory > 0 else 0

        violation = db.query(models.DisciplinaryMark).filter(
            models.DisciplinaryMark.curator_id == curator.id,
            models.DisciplinaryMark.is_active == True
        ).first()

        has_violation = violation is not None
        
        violation_reason = None
        if has_violation:
            if current_user.system_role == "ADMIN" or current_user.id == curator.id:
                violation_reason = violation.reason

        rating_list.append({
            "curator_id": curator.id,
            "username": curator.username,
            "points": total_points,
            "completion_percentage": int(completion_pct),
            "additional_points": additional_points,
            "has_violation": has_violation,
            "violation_reason": violation_reason
        })

    rating_list.sort(key=lambda x: x["points"], reverse=True)

    final_rating = []
    for index, item in enumerate(rating_list):
        item["place"] = index + 1
        final_rating.append(schemas.RatingItemResponse(**item))

    return final_rating


# Начисление / Снятие дополнительных баллов (с уведомлением куратора!)
@router.post("/sanctions/adjust-points", response_model=schemas.PointAdjustmentResponse)
def adjust_curator_points(
    adj_in: schemas.PointAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    curator = db.query(models.User).filter(models.User.id == adj_in.curator_id).first()
    if not curator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Куратор не найден")

    new_adj = models.PointAdjustment(
        curator_id=adj_in.curator_id,
        points=adj_in.points,
        reason=adj_in.reason,
        admin_id=current_user.id
    )
    db.add(new_adj)
    db.commit()
    db.refresh(new_adj)

    # ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ: Корректировка баллов (Раздел 34 ТЗ)
    direction = "начислено" if adj_in.points >= 0 else "снято"
    add_notification(
        db,
        curator_id=adj_in.curator_id,
        text=f"Вам {direction} {abs(adj_in.points)} дополнительных баллов. Причина: {adj_in.reason}",
        n_type="points"
    )

    return new_adj


# Вынесение дисциплинарной отметки (с уведомлением куратора!)
@router.post("/sanctions/disciplinary-mark", status_code=status.HTTP_201_CREATED)
def issue_disciplinary_mark(
    mark_in: schemas.DisciplinaryMarkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    curator = db.query(models.User).filter(models.User.id == mark_in.curator_id).first()
    if not curator:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Куратор не найден")

    new_mark = models.DisciplinaryMark(
        curator_id=mark_in.curator_id,
        reason=mark_in.reason,
        admin_id=current_user.id
    )
    db.add(new_mark)
    db.commit()

    # ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ: Выговор / взыскание (Раздел 34 ТЗ)
    add_notification(
        db,
        curator_id=mark_in.curator_id,
        text=f"Вам вынесена дисциплинарная отметка (⚠). Причина: {mark_in.reason}",
        n_type="review"
    )

    return {"message": f"Куратору {curator.username} установлена дисциплинарная отметка"}


@router.delete("/sanctions/disciplinary-mark/{curator_id}")
def remove_disciplinary_mark(
    curator_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    mark = db.query(models.DisciplinaryMark).filter(
        models.DisciplinaryMark.curator_id == curator_id,
        models.DisciplinaryMark.is_active == True
    ).first()

    if not mark:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Дисциплинарная отметка не найдена")

    mark.is_active = False
    db.add(mark)
    db.commit()
    return {"message": "Дисциплинарная отметка успешно снята"}


@router.post("/sanctions/executions/{execution_id}/invalidate")
def invalidate_execution(
    execution_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    execution = db.query(models.TaskExecution).filter(models.TaskExecution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Запись выполнения не найдена")

    execution.status = "NOT_STARTED"
    execution.points_awarded = 0
    execution.photo_url = None
    execution.admin_comment = "Выполнение было аннулировано Администратором"

    db.add(execution)
    db.commit()
    return {"message": "Выполнение задачи аннулировано"}