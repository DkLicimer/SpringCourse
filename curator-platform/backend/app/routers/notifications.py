import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/notifications",
    tags=["Уведомления кураторов"]
)

# Служебная (утилитарная) функция для вызова внутри других роутеров
def add_notification(db: Session, curator_id: uuid.UUID, text: str, n_type: str):
    db_notif = models.Notification(
        curator_id=curator_id,
        text=text,
        type=n_type
    )
    db.add(db_notif)
    # Вызываем коммит на транзакцию уведомления отдельно
    db.commit()


# 1. Получение списка всех уведомлений текущего куратора (сначала непрочитанные)
@router.get("/", response_model=List[schemas.NotificationResponse])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Notification).filter(
        models.Notification.curator_id == current_user.id
    ).order_by(models.Notification.is_read.asc(), models.Notification.created_at.desc()).all()


# 2. Отметить конкретное уведомление как прочитанное
@router.post("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.curator_id == current_user.id
    ).first()

    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Уведомление не найдено")

    notif.is_read = True
    db.add(notif)
    db.commit()
    return {"message": "Уведомление прочитано"}


# 3. Отметить ВСЕ уведомления текущего куратора как прочитанные
@router.post("/read-all")
def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db.query(models.Notification).filter(
        models.Notification.curator_id == current_user.id,
        models.Notification.is_read == False
    ).update({models.Notification.is_read: True}, synchronize_session=False)

    db.commit()
    return {"message": "Все уведомления отмечены как прочитанные"}