from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Cabin, RecreationBooking, Guest

class RecreationBookingService:
    @staticmethod
    def calculate_price(cabin: Cabin, second_cabin: Cabin | None, guests_data: list, role: str, days: int) -> float:
        if days <= 0:
            raise ValidationError("Дата выезда должна быть позже даты заезда.")
        
        price = 0
        if role == RecreationBooking.UserRole.STAFF:
            price += float(cabin.price_staff_full_cabin) * days
            if second_cabin:
                price += float(second_cabin.price_staff_full_cabin) * days
        else:
            if cabin.price_student_bed <= 0:
                raise ValidationError("Данный объект недоступен по студенческому тарифу.")
            # Для студентов расчет по количеству мест
            price += float(cabin.price_student_bed) * days
            if second_cabin:
                price += float(second_cabin.price_student_bed) * days
        return price

    @classmethod
    def create_booking(cls, validated_data: dict) -> RecreationBooking:
        cabin_id = validated_data['cabin'].id if hasattr(validated_data['cabin'], 'id') else validated_data['cabin']
        second_cabin_id = validated_data.get('second_cabin').id if validated_data.get('second_cabin') else None
        start = validated_data['start_date']
        end = validated_data['end_date']
        role = validated_data['user_role']
        guests = validated_data.pop('guests', [])
        days = (end - start).days

        with transaction.atomic():
            cabin_ids = [cabin_id]
            if second_cabin_id:
                cabin_ids.append(second_cabin_id)

            # Блокируем строки домиков во избежание параллельного овербукинга
            cabins_locked = list(Cabin.objects.select_for_update().filter(id__in=cabin_ids).order_by('id'))
            primary_cabin = next(c for c in cabins_locked if c.id == cabin_id)
            sec_cabin = next((c for c in cabins_locked if c.id == second_cabin_id), None)

            # Проверяем пересечения
            conflict = RecreationBooking.objects.filter(
                cabin__in=cabin_ids,
                start_date__lt=end,
                end_date__gt=start
            ).exclude(
                status__in=[RecreationBooking.Status.CANCELLED, RecreationBooking.Status.REJECTED]
            ).exists()

            if conflict:
                raise ValidationError("Один из выбранных домиков уже забронирован на указанные даты.")

            total_price = cls.calculate_price(primary_cabin, sec_cabin, guests, role, days)
            validated_data['total_price'] = total_price
            
            booking = RecreationBooking.objects.create(**validated_data)
            for g in guests:
                Guest.objects.create(booking=booking, **g)

        return booking