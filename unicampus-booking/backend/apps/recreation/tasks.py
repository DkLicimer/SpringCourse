import base64
from celery import shared_task
from django.utils import timezone
from .models import RecreationBooking
from .pdf import generate_voucher_pdf
from apps.notifications.tasks import send_email_async_task

@shared_task
def generate_and_send_voucher_task(booking_id: str):
    booking = RecreationBooking.objects.get(id=booking_id)
    pdf_bytes = generate_voucher_pdf(booking)
    b64_pdf = base64.b64encode(pdf_bytes).decode('utf-8')

    send_email_async_task.delay(
        subject=f"Путёвка на базу отдыха № {booking.booking_number}",
        body=f"Здравствуйте, {booking.contact_name}!\nОплата успешно подтверждена. Ваша путёвка во вложении.",
        to_email=booking.contact_email,
        attachments=[(f"Voucher_{booking.booking_number}.pdf", b64_pdf, "application/pdf")]
    )

@shared_task
def cleanup_expired_bookings_task():
    """Периодическая очистка неоплаченных заявок"""
    now = timezone.now()
    count = RecreationBooking.objects.filter(
        status=RecreationBooking.Status.PENDING,
        expires_at__lt=now
    ).update(status=RecreationBooking.Status.CANCELLED)
    return f"Cancelled {count} expired bookings"