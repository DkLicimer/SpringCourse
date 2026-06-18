from datetime import date
from django.utils import timezone
from django.db import transaction, models
from django.db.models import Q, Sum
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

def get_booked_beds_for_cabin(cabin_obj, start, end):
    """
    Вспомогательный метод подсчета занятых койко-мест.
    """
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
            total += 4 # Сотрудник всегда занимает весь второй домик целиком
    return total

class BookingCreateSerializer(serializers.ModelSerializer):
    guests = GuestSerializer(many=True, required=False)
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
        if start_date < date.today():
            raise serializers.ValidationError({"start_date": "Дата заезда не может быть в прошлом."})
        if start_date >= end_date:
            raise serializers.ValidationError({"end_date": "Дата выезда должна быть позже даты заезда."})

        max_allowed_date = date(start_date.year, 8, 31)
        if start_date > max_allowed_date or end_date > max_allowed_date:
            raise serializers.ValidationError(
                {"end_date": "Бронирование гостевых домов на текущий год возможно только до 31 августа включительно."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """
        Создание бронирования с защитой от одновременных запросов (Race Condition).
        """
        guests_data = validated_data.pop('guests', [])
        cabin = validated_data['cabin']
        second_cabin = validated_data.get('second_cabin')
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']
        user_role = validated_data['user_role']
        contact_email = validated_data['contact_email']
        contact_phone = validated_data['contact_phone']
        
        # Блокируем строки домиков в БД для исключения овербукинга
        cabins_to_lock = [cabin.id]
        if second_cabin:
            cabins_to_lock.append(second_cabin.id)
        
        # SQL: SELECT ... FOR UPDATE
        list(Cabin.objects.select_for_update().filter(id__in=cabins_to_lock))

        # 1. Лимиты сотрудников
        if user_role == Booking.UserRole.STAFF:
            validated_data['num_beds_booked'] = 4
            existing_user_bookings = Booking.objects.filter(
                start_date__lt=end_date,
                end_date__gt=start_date
            ).filter(
                Q(contact_email=contact_email) | Q(contact_phone=contact_phone)
            ).exclude(
                status__in=[Booking.Status.CANCELLED, Booking.Status.REJECTED]
            )
            
            already_booked_count = 0
            for b in existing_user_bookings:
                already_booked_count += 1
                if b.second_cabin: already_booked_count += 1
            
            requested_now = 2 if second_cabin else 1
            if already_booked_count + requested_now > 2:
                raise serializers.ValidationError("Один сотрудник не может забронировать более двух домиков на один период.")

        # 2. Доступность первого домика
        booked_first = get_booked_beds_for_cabin(cabin, start_date, end_date)
        if user_role == Booking.UserRole.STAFF:
            if booked_first > 0:
                raise serializers.ValidationError({"cabin": f"Домик №{cabin.number} уже занят на эти даты."})
        else:
            beds_req = validated_data.get('num_beds_booked', 1)
            if booked_first + beds_req > 4:
                raise serializers.ValidationError({"cabin": f"В домике №{cabin.number} недостаточно мест. Свободно: {4 - booked_first}"})

        # 3. Доступность второго домика
        if second_cabin:
            if second_cabin == cabin:
                raise serializers.ValidationError({"second_cabin": "Нельзя выбрать один и тот же домик дважды."})
            booked_second = get_booked_beds_for_cabin(second_cabin, start_date, end_date)
            if booked_second > 0:
                raise serializers.ValidationError({"second_cabin": f"Второй домик №{second_cabin.number} уже занят."})

        # Расчет цены
        days = (end_date - start_date).days
        if user_role == Booking.UserRole.STAFF:
            price = cabin.price_staff_full_cabin * days
            if second_cabin:
                price += second_cabin.price_staff_full_cabin * days
        else:
            price = (cabin.price_student_bed * validated_data['num_beds_booked']) * days

        validated_data['total_price'] = price
        booking = Booking.objects.create(**validated_data)

        for guest_data in guests_data:
            Guest.objects.create(booking=booking, **guest_data)

        send_booking_notification(booking, "CREATED")
        return booking

class ReceiptUploadSerializer(serializers.ModelSerializer):
    """Класс, который был потерян в прошлом сообщении"""
    class Meta:
        model = PaymentReceipt
        fields = ['file', 'user_comment']

    def validate_file(self, value):
        ext = value.name.split('.')[-1].lower()
        if ext not in ['pdf', 'png', 'jpg', 'jpeg']:
            raise serializers.ValidationError("Разрешены только форматы PDF, PNG, JPG/JPEG.")
        return value