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

@router.get("/social-categories", response_model=List[schemas.DirectoryItemResponse])
def get_social_categories(db: Session = Depends(get_db)):
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


# --- СТУДЕНЧЕСКИЕ ОРГАНИЗАЦИИ ---

@router.get("/organizations", response_model=List[schemas.DirectoryItemResponse])
def get_organizations(db: Session = Depends(get_db)):
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