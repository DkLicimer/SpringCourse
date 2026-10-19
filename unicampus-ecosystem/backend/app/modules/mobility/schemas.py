import uuid
from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field
from app.modules.mobility.models import MobilityTripType, MobilityTripStatus, ApprovalStage


class TripCreate(BaseModel):
    trip_type: MobilityTripType
    title: str = Field(..., min_length=3, max_length=255)
    destination_city: str = Field(..., min_length=2, max_length=100)
    host_organization: str = Field(..., min_length=2, max_length=255)
    start_date: date
    end_date: date
    invitation_file_url: str = Field(..., description="URL скана вызова/приглашения")
    
    estimated_transport_cost: float = Field(default=0.0, ge=0)
    estimated_living_cost: float = Field(default=0.0, ge=0)
    estimated_daily_cost: float = Field(default=0.0, ge=0)
    funded_by_university: bool = True


class ApprovalStepResponse(BaseModel):
    id: uuid.UUID
    stage: ApprovalStage
    reviewer_name: Optional[str] = None
    is_approved: Optional[bool] = None
    comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MobilityReportCreate(BaseModel):
    certificate_file_url: str = Field(..., description="URL скана диплома/сертификата")
    financial_report_file_url: Optional[str] = Field(None, description="URL авансового отчета и билетов")
    summary_text: str = Field(..., min_length=10, description="Итоги участия в мероприятии")


class MobilityReportResponse(BaseModel):
    id: uuid.UUID
    certificate_file_url: str
    financial_report_file_url: Optional[str] = None
    summary_text: str
    is_accepted: bool
    admin_comment: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True


class TripResponse(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: Optional[str] = None
    group_name: Optional[str] = None
    trip_type: MobilityTripType
    title: str
    destination_city: str
    host_organization: str
    start_date: date
    end_date: date
    invitation_file_url: str
    total_estimated_budget: float
    funded_by_university: bool
    status: MobilityTripStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    approval_steps: List[ApprovalStepResponse] = []
    report: Optional[MobilityReportResponse] = None

    class Config:
        from_attributes = True


class StepReviewSubmit(BaseModel):
    approve: bool
    comment: Optional[str] = Field(None, description="Комментарий (обязателен при отклонении)")