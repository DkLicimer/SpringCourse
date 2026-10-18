from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Room, SpaceBooking
from apps.notifications.tasks import send_email_async_task

class SpaceBookingService:
    @staticmethod
    def create_booking(data: dict) -> SpaceBooking:
        room_id = data['room'].id if hasattr(data['room'], 'id') else data['room']
        start = data['start_time']
        end = data['end_time']
        now = timezone.now()

        if start >= end:
            raise ValidationError({"end_time": "Время окончания должно быть позже времени начала."})
        if start < now + timedelta(hours=24):
            raise ValidationError({"start_time": "Бронирование доступно минимум за 24 часа."})
        if start > now + timedelta(days=180):
            raise ValidationError({"start_time": "Максимальный горизонт бронирования — 180 дней."})

        # Атомарная секция с пессимистической блокировкой родительской аудитории
        with transaction.atomic():
            room = Room.objects.select_for_update().get(id=room_id)
            if not room.is_active:
                raise ValidationError({"room": "Помещение временно недоступно для бронирования."})

            overlap = SpaceBooking.objects.filter(
                room=room,
                status=SpaceBooking.Status.APPROVED,
                start_time__lt=end,
                end_time__gt=start
            ).exists()

            if overlap:
                raise ValidationError("Выбранное время уже занято другим подтвержденным мероприятием.")

            booking = SpaceBooking.objects.create(**data)

        # Вызов фонового уведомления
        send_email_async_task.delay(
            subject=f"Заявка #{booking.id} зарегистрирована",
            body=f"Здравствуйте, {booking.applicant_full_name}!\nЗаявка на '{booking.event_name}' передана на рассмотрение.",
            to_email=booking.applicant_email
        )
        return booking