import os
import jwt
from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .database import get_db
from . import models, schemas

load_dotenv()

# Секретные настройки из .env
SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret_key_for_dev_only_123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # Токен будет действовать 24 часа

# Схема безопасности, указывающая FastAPI, где искать токен (в заголовке Authorization: Bearer <token>)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# 1. Хэширование пароля
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# 2. Проверка соответствия пароля хэшу
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# 3. Создание JWT-токена
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# 4. Функция (dependency) для получения текущего пользователя по его токену
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось валидировать учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Декодируем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        
        if username is None or user_id is None:
            raise credentials_exception
            
        token_data = schemas.TokenData(username=username, user_id=user_id)
    except jwt.PyJWTError:
        raise credentials_exception
        
    # Ищем пользователя в базе данных
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

# 5. Функция проверки, является ли пользователь администратором
def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.system_role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения операции (требуются права Администратора)"
        )
    return current_user