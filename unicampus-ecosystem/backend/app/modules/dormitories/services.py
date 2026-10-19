import uuid
from datetime import datetime, timezone, date
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.modules.dormitories.models import (
    Dormitory, DormRoom, DormBed, DormApplication, DormStay,
    DormApplicationStatus, DormStayStatus
)
from app.modules.curators.models import Student
from app.modules.dormitories import schemas


class DormitoryService:
    @staticmethod
    def create_dormitory_with_rooms(
        db: Session,
        dorm_in: schemas.DormitoryCreate,
        rooms_count_per_floor: int = 15,
        floors: int = 5
    ) -> Dormitory:
        """Создание общежития с автоматической нарезкой комнат и койко-мест"""
        existing = db.query(Dormitory).filter(Dormitory.number == dorm_in.number).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Общежитие №{dorm_in.number} уже существует")

        dorm = Dormitory(**dorm_in.model_dump())
        db.add(dorm)
        db.commit()
        db.refresh(dorm)

        # Автоматическая генерация комнат и коек
        for floor in range(1, floors + 1):
            for r_idx in range(1, rooms_count_per_floor + 1):
                room_no = f"{floor}{r_idx:02d}"
                room = DormRoom(
                    dormitory_id=dorm.id,
                    room_number=room_no,
                    floor=floor,
                    capacity_beds=3,
                    price_per_month=1200.00
                )
                db.add(room)
                db.commit()
                db.refresh(room)

                # Создаем 3 койки на комнату
                for bed_no in range(1, 4):
                    db.add(DormBed(room_id=room.id, bed_number=bed_no, is_occupied=False))
        db.commit()
        return dorm

    @classmethod
    def review_application(
        cls,
        db: Session,
        app_id: uuid.UUID,
        review_data: schemas.DormApplicationReview,
        reviewer_id: uuid.UUID
    ) -> DormApplication:
        """Согласование заявления жилищным отделом и выписка электронного ордера"""
        app = db.query(DormApplication).filter(DormApplication.id == app_id).with_for_update().first()
        if not app:
            raise HTTPException(status_code=404, detail="Заявление не найдено")

        app.reviewer_id = reviewer_id
        app.reviewed_at = datetime.now(timezone.utc)

        if review_data.approve:
            if not review_data.assigned_bed_id:
                raise HTTPException(status_code=400, detail="При одобрении необходимо назначить конкретное койко-место")

            # Блокируем койку во избежание овербукинга
            bed = db.query(DormBed).filter(DormBed.id == review_data.assigned_bed_id).with_for_update().first()
            if not bed:
                raise HTTPException(status_code=404, detail="Койко-место не найдено")
            if bed.is_occupied:
                raise HTTPException(status_code=409, detail="Данное койко-место уже занято другим студентом")

            # Закрепляем койку за студентом
            bed.is_occupied = True
            bed.current_student_id = app.student_id

            app.assigned_bed_id = bed.id
            app.assigned_room_id = bed.room_id
            app.status = DormApplicationStatus.APPROVED

            # Формируем ордер на заселение (DormStay)
            order_no = f"ORD-{datetime.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:4].upper()}"
            stay = DormStay(
                order_number=order_no,
                student_id=app.student_id,
                bed_id=bed.id,
                check_in_date=date.today(),
                status=DormStayStatus.ACTIVE
            )
            db.add(stay)
        else:
            if not review_data.rejection_reason:
                raise HTTPException(status_code=400, detail="Укажите причину отказа в предоставлении общежития")
            app.status = DormApplicationStatus.REJECTED
            app.rejection_reason = review_data.rejection_reason

        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def get_stats(db: Session) -> schemas.DormStatsResponse:
        """Сводная загрузка коечного фонда университета"""
        total_dorms = db.query(Dormitory).filter(Dormitory.is_active == True).count()
        total_rooms = db.query(DormRoom).filter(DormRoom.is_active == True).count()
        total_beds = db.query(DormBed).count()
        occupied_beds = db.query(DormBed).filter(DormBed.is_occupied == True).count()
        free_beds = total_beds - occupied_beds

        rate = (occupied_beds / total_beds * 100) if total_beds > 0 else 0.0

        return schemas.DormStatsResponse(
            total_dormitories=total_dorms,
            total_rooms=total_rooms,
            total_beds=total_beds,
            occupied_beds=occupied_beds,
            free_beds=free_beds,
            occupancy_rate_percent=round(rate, 1)
        )