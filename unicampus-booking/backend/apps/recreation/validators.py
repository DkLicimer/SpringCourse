import magic
from rest_framework.exceptions import ValidationError

ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

def validate_receipt_file(uploaded_file):
    if uploaded_file.size > MAX_FILE_SIZE_BYTES:
        raise ValidationError(f"Файл превышает лимит 10 МБ. Текущий размер: {uploaded_file.size / (1024*1024):.1f} МБ")
    
    # Чтение первых 2048 байт для надежного определения magic bytes
    initial_bytes = uploaded_file.read(2048)
    uploaded_file.seek(0)
    
    mime_type = magic.from_buffer(initial_bytes, mime=True)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValidationError(f"Недопустимый формат файла ({mime_type}). Разрешены только PDF, JPG, PNG.")