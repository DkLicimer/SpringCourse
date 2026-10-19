import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.modules.mobility.models import (
    MobilityTrip, MobilityApprovalStep, MobilityReport,
    MobilityTripStatus, ApprovalStage
)
from app.modules.curators.models import Student
from app.modules.auth.models import User, UserRole
from app.modules.mobility import schemas


class MobilityService:
    @staticmethod
    def create_trip(db: Session, trip_in: schemas.TripCreate, user_id: uuid.UUID) -> MobilityTrip:
        """Подача заявки студентом и инициализация маршрута согласования"""
        student = db.query(Student).filter(Student.user_id == user_id).first()
        if not student:
            student = db.query(Student).filter(
                Student.last_name.ilike(db.query(User).filter(User.id == user_id).first().full_name.split()[0])
            ).first()

        if not student:
            raise HTTPException(status_code=400, detail="Профиль студента не найден в академических группах")

        if trip_in.start_date >= trip_in.end_date:
            raise HTTPException(status_code=400, detail="Дата возвращения должна быть позже даты отъезда")

        total_budget = (
            trip_in.estimated_transport_cost + 
            trip_in.estimated_living_cost + 
            trip_in.estimated_daily_cost
        )

        trip = MobilityTrip(
            student_id=student.id,
            user_id=user_id,
            trip_type=trip_in.trip_type,
            title=trip_in.title.strip(),
            destination_city=trip_in.destination_city.strip(),
            host_organization=trip_in.host_organization.strip(),
            start_date=trip_in.start_date,
            end_date=trip_in.end_date,
            invitation_file_url=trip_in.invitation_file_url,
            estimated_transport_cost=trip_in.estimated_transport_cost,
            estimated_living_cost=trip_in.estimated_living_cost,
            estimated_daily_cost=trip_in.estimated_daily_cost,
            total_estimated_budget=total_budget,
            funded_by_university=trip_in.funded_by_university,
            status=MobilityTripStatus.ON_REVIEW_CURATOR
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)

        # Формируем 3 обязательных этапа визирования
        steps = [
            MobilityApprovalStep(trip_id=trip.id, stage=ApprovalStage.CURATOR),
            MobilityApprovalStep(trip_id=trip.id, stage=ApprovalStage.DEAN),
            MobilityApprovalStep(trip_id=trip.id, stage=ApprovalStage.ACCOUNTING),
        ]
        db.add_all(steps)
        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def approve_stage(
        db: Session,
        trip_id: uuid.UUID,
        stage: ApprovalStage,
        review_data: schemas.StepReviewSubmit,
        reviewer_id: uuid.UUID
    ) -> MobilityTrip:
        """Переход по маршруту согласования (Куратор -> Деканат -> Бухгалтерия)"""
        trip = db.query(MobilityTrip).filter(MobilityTrip.id == trip_id).with_for_update().first()
        if not trip:
            raise HTTPException(status_code=404, detail="Заявка на поездку не найдена")

        step = db.query(MobilityApprovalStep).filter(
            MobilityApprovalStep.trip_id == trip.id,
            MobilityApprovalStep.stage == stage
        ).first()

        if not step:
            raise HTTPException(status_code=400, detail="Этап согласования не найден")

        step.reviewer_id = reviewer_id
        step.is_approved = review_data.approve
        step.comment = review_data.comment
        step.reviewed_at = datetime.now(timezone.utc)

        if not review_data.approve:
            trip.status = MobilityTripStatus.REJECTED
            trip.rejection_reason = f"Отклонено на этапе '{stage.value}': {review_data.comment or 'Без комментария'}"
        else:
            if stage == ApprovalStage.CURATOR:
                trip.status = MobilityTripStatus.ON_REVIEW_DEAN
            elif stage == ApprovalStage.DEAN:
                trip.status = MobilityTripStatus.ON_REVIEW_ACCOUNTING
            elif stage == ApprovalStage.ACCOUNTING:
                trip.status = MobilityTripStatus.APPROVED

        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def submit_report(
        db: Session,
        trip_id: uuid.UUID,
        report_in: schemas.MobilityReportCreate,
        user_id: uuid.UUID
    ) -> MobilityReport:
        """Сдача авансового отчета и сертификата студентом по возвращении"""
        trip = db.query(MobilityTrip).filter(MobilityTrip.id == trip_id, MobilityTrip.user_id == user_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Поездка не найдена")

        if trip.status not in [MobilityTripStatus.APPROVED, MobilityTripStatus.REPORT_SUBMITTED]:
            raise HTTPException(status_code=400, detail="Отчет можно подать только по согласованной поездке")

        report = db.query(MobilityReport).filter(MobilityReport.trip_id == trip.id).first()
        if not report:
            report = MobilityReport(
                trip_id=trip.id,
                certificate_file_url=report_in.certificate_file_url,
                financial_report_file_url=report_in.financial_report_file_url,
                summary_text=report_in.summary_text.strip()
            )
            db.add(report)
        else:
            report.certificate_file_url = report_in.certificate_file_url
            report.financial_report_file_url = report_in.financial_report_file_url
            report.summary_text = report_in.summary_text.strip()
            report.submitted_at = datetime.now(timezone.utc)

        trip.status = MobilityTripStatus.REPORT_SUBMITTED
        db.commit()
        db.refresh(report)
        return report