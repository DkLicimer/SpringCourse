# registration.py

# import json # Больше не нужно
# USERS_FILE = "neymark/backend/apps/tg_bot/users.json" # Больше не нужно

import db # Импортируем наш новый модуль базы данных

# Функции load_users и save_users больше не нужны для работы бота
# Они использовались только для миграции

def is_user_registered(chat_id: int) -> bool:
    """Проверяет регистрацию пользователя через базу данных."""
    user = db.get_user_by_telegram_id(chat_id)
    return user is not None

def get_or_create_user(telegram_id: int) -> int:
    """
    Получает ID пользователя из базы данных, или создает нового, если не найден.
    Возвращает user_id (int) или None в случае критической ошибки при создании.
    """
    return db.get_or_create_user_id(telegram_id)