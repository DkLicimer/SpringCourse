import logging
from django.core.mail import EmailMessage
from django.conf import settings

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_email(subject: str, body: str, to_email: str, attachments=None):
        try:
            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[to_email],
                bcc=[settings.DEFAULT_FROM_EMAIL] if settings.DEFAULT_FROM_EMAIL else []
            )
            if attachments:
                for filename, content, mime_type in attachments:
                    email.attach(filename, content, mime_type)
            
            email.send(fail_silently=False)
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False