from datetime import date
from django.utils import timezone
from rest_framework import serializers
from .models import Cabin, Booking, Guest, PaymentReceipt


class CabinSerializer(serializers.ModelSerializer):
    """Сериализатор для вывода информации о домиках на карте"""
    class Meta:
        model = Cabin
        fields = ['id', 'number', 'capacity', 'price_staff_full_cabin', 'price_student_bed', 'description']


class GuestSerializer(serializers.ModelSerializer):
    """Сериализатор для списка гостей"""
    class Meta:
        model = Guest
        fields = ['full_name', 'category']


class BookingCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания бронирования"""
    guests = GuestSerializer(many=True, required=False)

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_number', 'cabin', 'user_role', 'num_beds_booked',
            'start_date', 'end_date', 'total_price', 'expires_at',
            'status',  # ДОБАВИЛИ ПОЛЕ СТАТУСА ДЛЯ ФРОНТЕНДА
            'contact_name', 'contact_phone', 'contact_email',
            'department', 'position', 'faculty', 'academic_group', 'guests'
        ]
        read_only_fields = ['id', 'booking_number', 'total_price', 'expires_at', 'status'] # статус только для чтения

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        user_role = attrs.get('user_role')
        cabin = attrs.get('cabin')
        num_beds_booked = attrs.get('num_beds_booked', 1)

        # 1. Базовая проверка дат
        if start_date < date.today():
            raise serializers.ValidationError({"start_date": "Дата заезда не может быть в прошлом."})
        if start_date >= end_date:
            raise serializers.ValidationError({"end_date": "Дата выезда должна быть позже даты заезда."})

        # 2. Ограничения для студентов (только с понедельника по пятницу)
        if user_role == Booking.UserRole.STUDENT:
            if start_date.weekday() > 4 or end_date.weekday() > 4:
                raise serializers.ValidationError(
                    "Студенты могут бронировать места только на будние дни (с понедельника по пятницу)."
                )
            if num_beds_booked > 4:
                raise serializers.ValidationError(
                    "Студент не может забронировать более 4 койко-мест."
                )

        # 3. Для сотрудников бронь всегда занимает весь домик (4 места)
        if user_role == Booking.UserRole.STAFF:
            attrs['num_beds_booked'] = 4
            num_beds_booked = 4

        # 4. Проверка доступности мест на выбранные даты
        overlapping_bookings = Booking.objects.filter(
            cabin=cabin,
            start_date__lt=end_date,
            end_date__gt=start_date
        ).exclude(
            status__in=[Booking.Status.CANCELLED, Booking.Status.REJECTED]
        )

        total_booked_beds = sum(b.num_beds_booked for b in overlapping_bookings)

        if user_role == Booking.UserRole.STAFF:
            if total_booked_beds > 0:
                raise serializers.ValidationError(
                    "Этот домик уже частично или полностью забронирован на выбранные даты."
                )
        else:
            if total_booked_beds + num_beds_booked > 4:
                raise serializers.ValidationError(
                    f"В домике недостаточно свободных койко-мест. Доступно: {4 - total_booked_beds}."
                )

        return attrs

    def create(self, validated_data):
        guests_data = validated_data.pop('guests', [])
        user_role = validated_data['user_role']
        cabin = validated_data['cabin']
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']
        num_beds_booked = validated_data['num_beds_booked']

        # Расчет стоимости
        days = (end_date - start_date).days
        if user_role == Booking.UserRole.STAFF:
            total_price = cabin.price_staff_full_cabin * days
        else:
            total_price = (cabin.price_student_bed * num_beds_booked) * days

        validated_data['total_price'] = total_price

        booking = Booking.objects.create(**validated_data)

        for guest_data in guests_data:
            Guest.objects.create(booking=booking, **guest_data)

        return booking


class ReceiptUploadSerializer(serializers.ModelSerializer):
    """Сериализатор для загрузки чека подтверждения оплаты"""
    class Meta:
        model = PaymentReceipt
        fields = ['file', 'user_comment']

    def validate_file(self, value):
        # Проверка расширения файла (PDF, PNG, JPEG)
        ext = value.name.split('.')[-1].lower()
        if ext not in ['pdf', 'png', 'jpg', 'jpeg']:
            raise serializers.ValidationError("Разрешены только форматы PDF, PNG, JPG/JPEG.")
        return value