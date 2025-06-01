BASE_URL = 'http://127.0.0.1:8000'
# BASE_URL = ''


DONT_CHECK_USER = 'admin'
# DONT_CHECK_USER = ''



SECRET_KEY = 'django-insecure330$a0y6!j+(kp32*=tn^vcxxcv7e3$xyjyp$=xc1b0+^pv+'

CORS_ORIGIN_WHITELIST = ["http://localhost:3000", 'http://localhost:8000', 'http://localhost', 'http://0.0.0.0', 'http://127.0.0.1']
CORS_ALLOWED_ORIGINS = ["http://localhost:3000", 'http://localhost:8000', 'http://localhost', 'http://0.0.0.0', 'http://127.0.0.1']
CSRF_TRUSTED_ORIGINS = ["http://localhost:3000", 'http://localhost:8000', 'http://localhost', 'http://0.0.0.0', 'http://127.0.0.1']

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'db.sqlite3',
    },
}

ALLOWED_HOSTS = ['*']


LIMIT_ROW_ON_PAGE = 50

TELEGRAM_TOKEN = None
TELEGRAM_CHAT_ID = None
TELEGRAM_THEME_ID = None

EMAIL_HOST = "smtp.beget.com"
EMAIL_HOST_USER = "info@koval-lite-chita.ru"
EMAIL_HOST_PASSWORD = None
EMAIL_PORT = 465
EMAIL_USE_SSL = True
SERVER_EMAIL = "info@koval-lite-chita.ru"
DEFAULT_FROM_EMAIL = "info@koval-lite-chita.ru"