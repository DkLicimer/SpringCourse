import os
from celery import Celery
from celery.schedules import crontab

# Устанавливаем настройки Django по умолчанию для Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('unicampus')

# Читаем конфигурацию из settings.py с префиксом CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Автоматически находим задачи (tasks.py) во всех приложениях
app.autodiscover_tasks()

# Периодические задачи Celery Beat
app.conf.beat_schedule = {
    'cleanup-expired-bookings-every-5-min': {
        'task': 'apps.recreation.tasks.cleanup_expired_bookings_task',
        'schedule': crontab(minute='*/5'),
    },
}