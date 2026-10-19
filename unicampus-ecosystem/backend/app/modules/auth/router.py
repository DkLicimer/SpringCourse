from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token
from app.core.permissions import get_current_user, require_roles
from app.modules.auth.models import User, UserRole
from app.modules.auth import schemas

router = APIRouter(prefix="/auth", tags=["1. Единая Авторизация (SSO Gateway)"])

@router.post("/login", response_model=schemas.TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Универсальный вход: принимает логин или email,
    валидирует пароль и возвращает JWT токен вместе с ролью.
    """
    login_id = form_data.username.strip().lower()
    
    user = db.query(User).filter(
        or_(
            User.username.ilike(login_id),
            User.email.ilike(login_id)
        )
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин/email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Учетная запись заблокирована")

    token = create_access_token(subject=user.id, role=user.role.value)
    
    return schemas.TokenResponse(
        access_token=token,
        role=user.role,
        full_name=user.full_name,
        is_ddm_officer=user.is_ddm_officer
    )

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Возвращает информацию о текущем авторизованном пользователе"""
    return current_user

@router.post("/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles([UserRole.ADMIN]))
):
    """Создание пользователей администратором системы"""
    existing = db.query(User).filter(
        or_(User.username == user_in.username, User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Логин или Email уже заняты")

    new_user = User(
        username=user_in.username.strip(),
        email=user_in.email.strip().lower() if user_in.email else None,
        phone=user_in.phone,
        full_name=user_in.full_name.strip(),
        password_hash=hash_password(user_in.password),
        role=user_in.role,
        is_ddm_officer=user_in.is_ddm_officer,
        external_1c_guid=user_in.external_1c_guid
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user