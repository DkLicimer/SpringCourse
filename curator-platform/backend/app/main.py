from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from . import models
from .routers import auth, groups, tasks, directories, rating, surveys, notifications

# Автоматически создаем/обновляем таблицы в PostgreSQL при запуске
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Электронная книжка куратора API",
    description="Бэкенд-платформа для управления кураторами и академическими группами",
    version="0.1.0",
    docs_url="/docs",  # Путь к интерактивной документации Swagger
    redoc_url="/redoc"
)

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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Бэкенд запущен, СУБД и все роутеры системы куратора (включая Уведомления) подключены"
    }