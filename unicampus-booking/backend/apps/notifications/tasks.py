from celery import shared_task
import logging
from django.core.mail import EmailMessage
from django.conf import settings

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_email_async_task(self, subject: str, body: str, to_email: str, attachments=None):
    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email]
        )
        if attachments:
            for filename, content_b64, mime_type in attachments:
                import base64
                content = base64.b64decode(content_b64)
                email.attach(filename, content, mime_type)
        email.send(fail_silently=False)
        return f"Sent to {to_email}"
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        raise self.retry(exc=exc)