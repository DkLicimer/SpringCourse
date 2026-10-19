import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet
from app.core.config import settings

def _get_cipher_suite() -> Fernet:
    """Генерация детерминированного 32-байтного ключа Fernet (AES-128/256) на базе системного SECRET_KEY"""
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)

cipher_suite = _get_cipher_suite()

def encrypt_value(plain_text: Optional[str]) -> Optional[str]:
    """Шифрование конфиденциального поля перед записью в PostgreSQL"""
    if plain_text is None:
        return None
    token = cipher_suite.encrypt(plain_text.strip().encode("utf-8"))
    return token.decode("utf-8")

def decrypt_value(cipher_text: Optional[str]) -> Optional[str]:
    """Расшифровка поля для авторизованного офицера ДДМ"""
    if not cipher_text:
        return None
    try:
        decrypted_bytes = cipher_suite.decrypt(cipher_text.encode("utf-8"))
        return decrypted_bytes.decode("utf-8")
    except Exception:
        return "[ОШИБКА ДЕШИФРОВАНИЯ]"