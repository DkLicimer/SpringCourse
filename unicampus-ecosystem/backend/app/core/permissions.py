import uuid
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.core.database import get_db
from app.modules.auth.models import User, UserRole

# Путь для Swagger авторизации
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Извлечение и валидация пользователя из JWT токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительный токен авторизации или сессия истекла",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Пользователь заблокирован или не найден")
    return user

def require_roles(allowed_roles: List[UserRole]):
    """Фабрика зависимостей: проверяет, входит ли роль пользователя в разрешенный список"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Суперадминистратор имеет сквозной доступ ко всем базовым разделам
        if current_user.role == UserRole.ADMIN:
            return current_user

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав. Требуется одна из ролей: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker

def require_ddm_access(current_user: User = Depends(get_current_user)) -> User:
    """Специальный допуск в изолированный контур ДДМ (только офицеры ДДМ или спец-админ)"""
    if not (current_user.is_ddm_officer or current_user.role == UserRole.OFFICER_DDM):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ к закрытому реестру персональных данных ДДМ запрещен"
        )
    return current_user