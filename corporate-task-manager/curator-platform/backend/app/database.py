import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Загружаем переменные из .env файла
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL не настроена в файле .env")

# Создаем движок SQLAlchemy
engine = create_engine(DATABASE_URL)

# Создаем фабрику сессий для работы с БД
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для наших будущих моделей (таблиц)
Base = declarative_base()

# Вспомогательная функция (dependency) для получения сессии БД в эндпоинтах FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()