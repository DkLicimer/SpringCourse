from datetime import timedelta
from django.utils import timezone
from rest_framework import serializers
from .models import Room, SpaceBooking

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'address', 'capacity', 'image', 'is_active']


class SpaceScheduleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceBooking
        fields = ['id', 'event_name', 'start_time', 'end_time', 'status']


class SpaceBookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceBooking
        fields = [
            'id', 'room', 'event_name', 'start_time', 'end_time',
            'sound_engineer_required', 'applicant_full_name',
            'applicant_position', 'applicant_email', 'applicant_phone'
        ]

    def validate(self, attrs):
        start = attrs.get('start_time')
        end = attrs.get('end_time')
        room = attrs.get('room')
        now = timezone.now()

        if start >= end:
            raise serializers.ValidationError({"end_time": "Время окончания должно быть позже времени начала."})

        # Бизнес-правило 1: не менее чем за 24 часа
        if start < now + timedelta(hours=24):
            raise serializers.ValidationError({"start_time": "Бронирование возможно не менее чем за 24 часа до начала."})

        # Бизнес-правило 2: не более чем на 6 месяцев вперед
        if start > now + timedelta(days=180):
            raise serializers.ValidationError({"start_time": "Бронирование возможно максимум на 6 месяцев вперед."})

        # Бизнес-правило 3: проверка пересечений со статусом APPROVED
        conflict = SpaceBooking.objects.filter(
            room=room,
            status=SpaceBooking.Status.APPROVED,
            start_time__lt=end,
            end_time__gt=start
        ).exists()

        if conflict:
            raise serializers.ValidationError("Выбранный интервал времени уже занят другим одобренным мероприятием.")

        return attrs