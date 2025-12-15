# file: config.py
import os
import logging
from dotenv import load_dotenv

# Загружаем переменные окружения из файла .env
load_dotenv()

# --- Токены ---
BOT_TOKEN = os.getenv("BOT_TOKEN")

# --- Функция для безопасной загрузки ID групп ---
def load_group_id(env_key):
    try:
        val = os.getenv(env_key)
        if not val:
            logging.critical(f"Переменная {env_key} не найдена в .env!")
            return 0
        return int(val)
    except (ValueError, TypeError):
        logging.critical(f"{env_key} имеет неверный формат (должно быть число)!")
        return 0

# --- Загружаем 3 разных ID групп ---
GROUP_AIR_ID = load_group_id("GROUP_AIR_ID")         # Группа "Чистый воздух"
GROUP_GARBAGE_CP_ID = load_group_id("GROUP_GARBAGE_CP_ID") # Группа "Контейнерные площадки"
GROUP_GARBAGE_UD_ID = load_group_id("GROUP_GARBAGE_UD_ID") # Группа "Свалки"

# --- Настройки SMTP для email ---
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = os.getenv("SMTP_PORT")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL")

# --- Регулярные выражения для валидации ---
PHONE_REGEX = r"^\+?[78][-\s(]*\d{3}[-\s)]*\d{3}[-\s]*\d{2}[-\s]*\d{2}$"
EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

# --- Лимиты на размер файлов ---
MAX_VIDEO_SIZE_MB = 20
MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024

MAX_VIDEO_NOTE_SIZE_MB = 10
MAX_VIDEO_NOTE_SIZE_BYTES = MAX_VIDEO_NOTE_SIZE_MB * 1024 * 1024