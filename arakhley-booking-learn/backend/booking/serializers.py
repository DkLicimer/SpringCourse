from datetime import date
from django.utils import timezone
from django.db.models import Q
from rest_framework import serializers
from .models import Cabin, Booking, Guest, PaymentReceipt
from .utils import send_booking_notification


class CabinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cabin
        fields = ['id', 'number', 'capacity', 'price_staff_full_cabin', 'price_student_bed', 'description']


class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ['full_name', 'category']


# Вспомогательный метод подсчета занятых койко-мест в конкретном домике
def get_booked_beds_for_cabin(cabin_obj, start, end):
    bookings = Booking.objects.filter(
        start_date__lt=end,
        end_date__gt=start
    ).exclude(
        status__in=[Booking.Status.CANCELLED, Booking.Status.REJECTED]
    )
    
    total = 0
    for b in bookings:
        if b.cabin == cabin_obj:
            total += b.num_beds_booked
        elif b.second_cabin == cabin_obj:
            # Второй домик всегда бронируется сотрудником целиком (4 места)
            total += 4
    return total


class BookingCreateSerializer(serializers.ModelSerializer):
    guests = GuestSerializer(many=True, required=False)
    
    # Номера домиков в текстовом виде для фронтенда
    cabin_number = serializers.ReadOnlyField(source='cabin.number')
    second_cabin_number = serializers.ReadOnlyField(source='second_cabin.number')

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_number', 'cabin', 'second_cabin', 'cabin_number', 'second_cabin_number',
            'user_role', 'num_beds_booked', 'start_date', 'end_date', 'total_price', 'expires_at',
            'status', 'contact_name', 'contact_phone', 'contact_email',
            'department', 'position', 'faculty', 'academic_group', 'guests'
        ]
        read_only_fields = ['id', 'booking_number', 'total_price', 'expires_at', 'status', 'cabin_number', 'second_cabin_number']

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        user_role = attrs.get('user_role')
        cabin = attrs.get('cabin')
        second_cabin = attrs.get('second_cabin')
        num_beds_booked = attrs.get('num_beds_booked', 1)
        contact_email = attrs.get('contact_email')
        contact_phone = attrs.get('contact_phone')

        # 1. Проверка дат на корректность
        if start_date < date.today():
            raise serializers.ValidationError({"start_date": "Дата заезда не может быть в прошлом."})
        if start_date >= end_date:
            raise serializers.ValidationError({"end_date": "Дата выезда должна быть позже даты заезда."})

        # 2. Лимит для сотрудников: максимум 2 домика одновременно
        if user_role == Booking.UserRole.STAFF:
            attrs['num_beds_booked'] = 4
            num_beds_booked = 4
            
            # Находим активные пересекающиеся брони этого же человека по Email или Телефону
            overlapping_user_bookings = Booking.objects.filter(
                start_date__lt=end_date,
                end_date__gt=start_date
            ).filter(
                Q(contact_email=contact_email) | Q(contact_phone=contact_phone)
            ).exclude(
                status__in=[Booking.Status.CANCELLED, Booking.Status.REJECTED]
            ).count()

            # Если он уже забронировал домики ранее (или сейчас бронирует 2 штуки, а ранее забронировал еще 1)
            # В сумме за период у одного сотрудника не может быть заблокировано более 2 домиков
            current_requested = 2 if second_cabin else 1
            if overlapping_user_bookings + current_requested > 2:
                raise serializers.ValidationError(
                    "Один сотрудник не может забронировать в общей сложности более двух домиков на один и тот же период."
                )

        # 3. Валидация свободных мест первого домика
        booked_first = get_booked_beds_for_cabin(cabin, start_date, end_date)
        if user_role == Booking.UserRole.STAFF:
            if booked_first > 0:
                raise serializers.ValidationError({"cabin": "Выбранный первый домик уже занят на эти даты."})
        else:
            if booked_first + num_beds_booked > 4:
                raise serializers.ValidationError({"cabin": f"В первом домике недостаточно свободных мест. Доступно: {4 - booked_first}."})

        # 4. Валидация второго домика (если выбран)
        if second_cabin:
            if second_cabin == cabin:
                raise serializers.ValidationError({"second_cabin": "Нельзя выбрать один и тот же домик дважды."})
            
            booked_second = get_booked_beds_for_cabin(second_cabin, start_date, end_date)
            if booked_second > 0:
                raise serializers.ValidationError({"second_cabin": "Выбранный второй домик уже занят на эти даты."})

        return attrs

    def create(self, validated_data):
        guests_data = validated_data.pop('guests', [])
        user_role = validated_data['user_role']
        cabin = validated_data['cabin']
        second_cabin = validated_data.get('second_cabin')
        num_beds_booked = validated_data['num_beds_booked']
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']

        # Вычисление суммарной стоимости
        days = (end_date - start_date).days
        if user_role == Booking.UserRole.STAFF:
            price = cabin.price_staff_full_cabin * days
            if second_cabin:
                price += second_cabin.price_staff_full_cabin * days
        else:
            price = (cabin.price_student_bed * num_beds_booked) * days

        validated_data['total_price'] = price

        booking = Booking.objects.create(**validated_data)

        for guest_data in guests_data:
            Guest.objects.create(booking=booking, **guest_data)

        # Отправляем одно монолитное письмо о создании бронирования
        send_booking_notification(booking, "CREATED")

        return booking


class ReceiptUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReceipt
        fields = ['file', 'user_comment']

    def validate_file(self, value):
        ext = value.name.split('.')[-1].lower()
        if ext not in ['pdf', 'png', 'jpg', 'jpeg']:
            raise serializers.ValidationError("Разрешены только форматы PDF, PNG, JPG/JPEG.")
        return value