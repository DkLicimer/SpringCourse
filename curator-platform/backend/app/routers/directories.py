import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/directories",
    tags=["Административные справочники"]
)

# --- СОЦИАЛЬНЫЕ КАТЕГОРИИ ---

# Получить все категории (для администратора - и активные, и деактивированные)
@router.get("/social-categories", response_model=List[schemas.DirectoryItemResponse])
def get_social_categories(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.system_role == "ADMIN":
        return db.query(models.SocialCategory).all()
    return db.query(models.SocialCategory).filter(models.SocialCategory.is_active == True).all()


@router.post("/social-categories", response_model=schemas.DirectoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_social_category(
    item_in: schemas.DirectoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    existing = db.query(models.SocialCategory).filter(models.SocialCategory.name == item_in.name).first()
    if existing:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Категория уже существует")
    
    new_item = models.SocialCategory(name=item_in.name)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/social-categories/{category_id}", response_model=schemas.DirectoryItemResponse)
def update_social_category(
    category_id: uuid.UUID,
    item_in: schemas.DirectoryItemCreate,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    category = db.query(models.SocialCategory).filter(models.SocialCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена")

    category.name = item_in.name
    category.is_active = is_active
    db.commit()
    db.refresh(category)
    return category


@router.delete("/social-categories/{category_id}")
def delete_social_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    category = db.query(models.SocialCategory).filter(models.SocialCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена")

    # Проверяем, используется ли категория кем-либо из студентов
    used = db.execute(
        models.student_social_categories.select().where(
            models.student_social_categories.c.category_id == category_id
        )
    ).first()
    
    if used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Нельзя удалить категорию, так как она прикреплена к студентам. Деактивируйте ее вместо удаления."
        )

    db.delete(category)
    db.commit()
    return {"message": "Категория успешно удалена"}


# --- СТУДЕНЧЕСКИЕ ОРГАНИЗАЦИИ ---

@router.get("/organizations", response_model=List[schemas.DirectoryItemResponse])
def get_organizations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.system_role == "ADMIN":
        return db.query(models.StudentOrganization).all()
    return db.query(models.StudentOrganization).filter(models.StudentOrganization.is_active == True).all()


@router.post("/organizations", response_model=schemas.DirectoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    item_in: schemas.DirectoryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    existing = db.query(models.StudentOrganization).filter(models.StudentOrganization.name == item_in.name).first()
    if existing:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Организация уже существует")
    
    new_item = models.StudentOrganization(name=item_in.name)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@router.put("/organizations/{organization_id}", response_model=schemas.DirectoryItemResponse)
def update_organization(
    organization_id: uuid.UUID,
    item_in: schemas.DirectoryItemCreate,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    org = db.query(models.StudentOrganization).filter(models.StudentOrganization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Организация не найдена")

    org.name = item_in.name
    org.is_active = is_active
    db.commit()
    db.refresh(org)
    return org


@router.delete("/organizations/{organization_id}")
def delete_organization(
    organization_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin)
):
    org = db.query(models.StudentOrganization).filter(models.StudentOrganization.id == organization_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Организация не найдена")

    used = db.execute(
        models.student_organizations_assoc.select().where(
            models.student_organizations_assoc.c.organization_id == organization_id
        )
    ).first()

    if used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Нельзя удалить организацию, так как она прикреплена к студентам. Деактивируйте ее вместо удаления."
        )

    db.delete(org)
    db.commit()
    return {"message": "Организация успешно удалена"}