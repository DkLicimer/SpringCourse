import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.curators.models import Student
from app.modules.mobility.models import (
    MobilityTrip, MobilityApprovalStep, MobilityReport,
    MobilityTripStatus, ApprovalStage
)
from app.modules.mobility import schemas
from app.modules.mobility.services import MobilityService

router = APIRouter(prefix="/mobility", tags=["7. Студенческая мобильность"])


def map_trip_response(trip: MobilityTrip) -> schemas.TripResponse:
    res = schemas.TripResponse.model_validate(trip)
    if trip.student:
        res.student_name = f"{trip.student.last_name} {trip.student.first_name}"
        res.group_name = trip.student.group.name if trip.student.group else "—"
    
    # Наполняем имена согласующих лиц в шагах
    for idx, step_model in enumerate(trip.approval_steps):
        if step_model.reviewer:
            res.approval_steps[idx].reviewer_name = step_model.reviewer.full_name
            
    if trip.report:
        res.report = schemas.MobilityReportResponse.model_validate(trip.report)
    return res


@router.post("/trips", response_model=schemas.TripResponse, status_code=status.HTTP_201_CREATED)
def apply_for_mobility(
    payload: schemas.TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Подача заявки на поездку (конференцию, стажировку, форум)"""
    trip = MobilityService.create_trip(db, payload, current_user.id)
    return map_trip_response(trip)


@router.get("/my-trips", response_model=List[schemas.TripResponse])
def get_my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Список всех заявок и поездок текущего студента"""
    trips = db.query(MobilityTrip).filter(
        MobilityTrip.user_id == current_user.id
    ).order_by(MobilityTrip.created_at.desc()).all()

    return [map_trip_response(t) for t in trips]


@router.get("/trips/pending", response_model=List[schemas.TripResponse])
def get_pending_trips(
    stage: Optional[ApprovalStage] = Query(None, description="Фильтр по этапу: CURATOR, DEAN, ACCOUNTING"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Очередь заявок, требующих согласования куратором, деканатом или бухгалтерией"""
    query = db.query(MobilityTrip)

    if stage == ApprovalStage.CURATOR:
        query = query.filter(MobilityTrip.status == MobilityTripStatus.ON_REVIEW_CURATOR)
    elif stage == ApprovalStage.DEAN:
        query = query.filter(MobilityTrip.status == MobilityTripStatus.ON_REVIEW_DEAN)
    elif stage == ApprovalStage.ACCOUNTING:
        query = query.filter(MobilityTrip.status == MobilityTripStatus.ON_REVIEW_ACCOUNTING)
    else:
        query = query.filter(MobilityTrip.status.in_([
            MobilityTripStatus.ON_REVIEW_CURATOR,
            MobilityTripStatus.ON_REVIEW_DEAN,
            MobilityTripStatus.ON_REVIEW_ACCOUNTING
        ]))

    trips = query.order_by(MobilityTrip.created_at.asc()).all()
    return [map_trip_response(t) for t in trips]


@router.post("/trips/{trip_id}/approve-stage", response_model=schemas.TripResponse)
def approve_trip_stage(
    trip_id: uuid.UUID,
    stage: ApprovalStage,
    review_data: schemas.StepReviewSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CURATOR, UserRole.HEAD_CURATOR, UserRole.STAFF]))
):
    """Визирование этапа заявки ответственным лицом (Куратор, Декан, Бухгалтер)"""
    trip = MobilityService.approve_stage(db, trip_id, stage, review_data, current_user.id)
    return map_trip_response(trip)


@router.post("/trips/{trip_id}/report", response_model=schemas.MobilityReportResponse, status_code=status.HTTP_201_CREATED)
def submit_post_trip_report(
    trip_id: uuid.UUID,
    payload: schemas.MobilityReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Прикрепление студентом отчета и сканов сертификатов/чеков по итогам поездки"""
    report = MobilityService.submit_report(db, trip_id, payload, current_user.id)
    return schemas.MobilityReportResponse.model_validate(report)


@router.post("/trips/{trip_id}/review-report", response_model=schemas.TripResponse)
def review_post_trip_report(
    trip_id: uuid.UUID,
    is_accepted: bool,
    admin_comment: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN, UserRole.STAFF]))
):
    """Приемка и закрытие авансового отчета и командировки отделом сопровождения"""
    trip = db.query(MobilityTrip).filter(MobilityTrip.id == trip_id).first()
    if not trip or not trip.report:
        raise HTTPException(status_code=404, detail="Отчет по поездке не найден")

    trip.report.is_accepted = is_accepted
    trip.report.admin_comment = admin_comment

    if is_accepted:
        trip.status = MobilityTripStatus.COMPLETED
    else:
        trip.status = MobilityTripStatus.REPORT_SUBMITTED

    db.commit()
    db.refresh(trip)
    return map_trip_response(trip)


@router.get("/trips/{trip_id}", response_model=schemas.TripResponse)
def get_trip_detail(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение подробной карточки поездки с историей визирования и отчетом"""
    trip = db.query(MobilityTrip).filter(MobilityTrip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    return map_trip_response(trip)