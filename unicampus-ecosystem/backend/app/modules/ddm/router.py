import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_ddm_access
from app.modules.auth.models import User
from app.modules.ddm.models import DDMProfile, DDMAuditLog, BenefitCategory, DDMAuditAction
from app.modules.ddm import schemas
from app.modules.ddm.services import DDMService

router = APIRouter(prefix="/ddm", tags=["8. Закрытый контур ДДМ (152-ФЗ)"])


@router.post("/profiles", response_model=schemas.DDMProfileDetail, status_code=status.HTTP_201_CREATED)
def create_ddm_profile(
    payload: schemas.DDMProfileCreate,
    request: Request,
    db: Session = Depends(get_db),
    officer: User = Depends(require_ddm_access)
):
    """Внесение льготника/ветерана/многодетной семьи в защищенный реестр с шифрованием AES-256"""
    profile = DDMService.create_profile(db, payload, officer, request.client.host if request.client else None)
    return DDMService.get_decrypted_profile(db, profile.id, officer, request.client.host if request.client else None)


@router.get("/profiles", response_model=List[schemas.DDMProfileListItem])
def get_ddm_profiles(
    category: Optional[BenefitCategory] = Query(None, description="Фильтр по льготной категории"),
    search: Optional[str] = Query(None, description="Поиск по ФИО"),
    request: Request = None,
    db: Session = Depends(get_db),
    officer: User = Depends(require_ddm_access)
):
    """Список записей в маскированном виде (без расшифровки паспорта и СНИЛС)"""
    query = db.query(DDMProfile).filter(DDMProfile.is_active == True)
    
    if category:
        query = query.filter(DDMProfile.category == category)
    if search:
        query = query.filter(DDMProfile.full_name.ilike(f"%{search.strip()}%"))

    profiles = query.order_by(DDMProfile.full_name.asc()).all()

    # Фиксация в журнале аудита факта выгрузки списка
    DDMService.log_audit(
        db, officer, DDMAuditAction.VIEW_LIST, None,
        request.client.host if request and request.client else None,
        f"Выгрузка списка реестра (найдено: {len(profiles)})"
    )

    return profiles


@router.get("/profiles/{profile_id}", response_model=schemas.DDMProfileDetail)
def get_single_ddm_profile(
    profile_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    officer: User = Depends(require_ddm_access)
):
    """Детальный просмотр карточки с расшифровкой ПДн (с обязательной записью в аудит)"""
    return DDMService.get_decrypted_profile(
        db, profile_id, officer, request.client.host if request.client else None
    )


@router.get("/audit-logs", response_model=List[schemas.DDMAuditLogResponse])
def get_audit_trail(
    db: Session = Depends(get_db),
    officer: User = Depends(require_ddm_access)
):
    """Неизменяемый журнал аудита действий должностных лиц (для проверки ИБ и регуляторов)"""
    return db.query(DDMAuditLog).order_by(DDMAuditLog.timestamp.desc()).limit(200).all()