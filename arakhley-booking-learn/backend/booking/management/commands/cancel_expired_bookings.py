from django.core.management.base import BaseCommand
from django.utils import timezone
from booking.models import Booking
from booking.utils import send_booking_notification


class Command(BaseCommand):
    help = 'Автоматическая отмена бронирований, не оплаченных в течение 1 часа'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # Находим бронирования со статусом "Ожидает оплаты", время жизни которых истекло
        expired_bookings = Booking.objects.filter(
            status=Booking.Status.PENDING_PAYMENT,
            expires_at__lt=now
        )

        count = expired_bookings.count()
        for booking in expired_bookings:
            booking.status = Booking.Status.CANCELLED
            booking.save()
            
            # Отправляем уведомление пользователю
            send_booking_notification(booking, "CANCELLED")

        if count > 0:
            self.stdout.write(self.style.SUCCESS(f'Успешно отменено просроченных бронирований: {count}'))
        else:
            self.stdout.write(self.style.NOTICE('Нет просроченных бронирований для отмены.'))