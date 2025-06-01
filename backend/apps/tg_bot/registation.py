import json
import re
from typing import Dict, Any, Tuple

USERS_FILE = "neymark/backend/apps/tg_bot/users.json"


def load_users() -> list:
    try:
        with open(USERS_FILE, "r") as file:
            content = file.read().strip()
            if not content:
                return []
            return json.loads(content)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_users(users: list) -> None:
    with open(USERS_FILE, "w") as file:
        json.dump(users, file, ensure_ascii=False, indent=4)

def is_user_registered(chat_id: int) -> bool:
    users = load_users()
    return any(user.get("telegram_id") == chat_id for user in users)

