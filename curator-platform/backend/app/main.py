import os
import uuid
import shutil
from fastapi import FastAPI, UploadFile, File, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import auth, groups, tasks, directories, rating, surveys, notifications, attendance
from .database import engine, Base
from . import models

# Автоматически создаем/обновляем таблицы в PostgreSQL при запуске
Base.metadata.create_all(bind=engine)

# Создаем папку под загружаемые файлы на сервере, если ее нет
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="Электронная книжка куратора API",
    description="Бэкенд-платформа для управления кураторами и академическими группами",
    version="0.1.0",
    docs_url="/docs",  # Путь к интерактивной документации Swagger
    redoc_url="/redoc"
)

# Раздаем папку uploads как статические файлы
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Настройка CORS, чтобы React-приложение (порт 5173) могло общаться с бэкендом
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Разрешаем все заголовки
)

# Подключаем роутеры под префиксом /api
app.include_router(auth.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(directories.router, prefix="/api")
app.include_router(rating.router, prefix="/api")
app.include_router(surveys.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")

# Глобальный эндпоинт загрузки файлов (Раздел 16 и 23 ТЗ)
@app.post("/api/upload", status_code=status.HTTP_201_CREATED)
def upload_file(file: UploadFile = File(...)):
    try:
        # Извлекаем расширение оригинального файла
        file_extension = os.path.splitext(file.filename)[1]
        # Генерируем уникальное UUID имя для предотвращения коллизий имен
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Записываем входящий поток на диск сервера
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Возвращаем абсолютный URL файла
        return {"url": f"http://localhost:8000/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не удалось сохранить файл на сервере: {str(e)}"
        )

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Бэкенд запущен, СУБД и файловое хранилище uploads/ подключено"
    }