from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(
    prefix="/auth",
    tags=["Аутентификация"]
)

# 1. Регистрация нового пользователя (для теста сделаем открытой, позже ограничим только для админов)
@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли пользователь с таким именем
    existing_user = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким именем уже зарегистрирован"
        )
    
    # Хэшируем пароль и сохраняем пользователя
    hashed_pwd = auth.hash_password(user_in.password)
    new_user = models.User(
        username=user_in.username,
        password_hash=hashed_pwd,
        system_role=user_in.system_role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

# 2. Вход в систему (генерация токена). Поддерживает стандартную форму OAuth2 (удобно для Swagger)
@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # Ищем пользователя по логину
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    # Проверяем пароль
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Генерируем токен и записываем туда полезную нагрузку
    token_data = {
        "sub": user.username,
        "user_id": str(user.id),
        "system_role": user.system_role
    }
    access_token = auth.create_access_token(data=token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}

# 3. Тестовый защищенный эндпоинт получения информации о себе
@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user