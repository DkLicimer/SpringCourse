from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Создаем пул соединений к СУБД
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,       # Автоматическая проверка живого соединения
    pool_size=20,             # Размер пула
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency для внедрения сессии БД в эндпоинты FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()