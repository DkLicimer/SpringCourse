# 1. Зарегистрируйте наши приложения в INSTALLED_APPS:
INSTALLED_APPS = [
    # ... стандартные приложения django ...
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Сторонние библиотеки
    'rest_framework',
    
    # Наше приложение
    'booking',
]

# 2. Настройки медиа-файлов (для защищенного хранения загружаемых чеков)
import os
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# 3. Настройка почтового сервера для MVP (вывод писем в консоль для тестов)
# В продакшене здесь прописываются хост, порт, логин и пароль от SMTP вуза
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'noreply@university.ru'