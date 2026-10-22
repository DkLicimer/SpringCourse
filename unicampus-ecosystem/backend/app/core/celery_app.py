from celery import Celery
from app.core.config import settings

celery_app = Celery("unicampus_worker")
celery_app.conf.broker_url = settings.CELERY_BROKER_URL
celery_app.conf.result_backend = settings.REDIS_URL
celery_app.conf.timezone = settings.TIMEZONE
celery_app.conf.task_track_started = True