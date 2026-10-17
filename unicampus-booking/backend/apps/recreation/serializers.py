from rest_framework import serializers
from .models import Cabin, RecreationBooking, Guest, PaymentReceipt

class CabinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cabin
        fields = '__all__'

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ['full_name', 'category', 'document_info', 'birth_date']

class RecreationBookingSerializer(serializers.ModelSerializer):
    guests = GuestSerializer(many=True, required=False)
    cabin_number = serializers.ReadOnlyField(source='cabin.number')
    second_cabin_number = serializers.ReadOnlyField(source='second_cabin.number')

    class Meta:
        model = RecreationBooking
        fields = '__all__'
        read_only_fields = ['id', 'booking_number', 'total_price', 'expires_at', 'status']

    def create(self, validated_data):
        guests_data = validated_data.pop('guests', [])
        cabin = validated_data['cabin']
        second_cabin = validated_data.get('second_cabin')
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']
        role = validated_data['user_role']

        days = (end_date - start_date).days
        if days <= 0:
            raise serializers.ValidationError("Дата выезда должна быть позже даты заезда.")

        # Расчет стоимости без хардкода!
        price = 0
        if role == RecreationBooking.UserRole.STAFF:
            # Считаем платных гостей
            paying_guests = sum(1 for g in guests_data if g.get('category') in [Guest.Category.ADULT, Guest.Category.CHILD_TEEN])
            paying_guests = max(1, paying_guests)
            price += cabin.price_staff_full_cabin * days
            if second_cabin:
                price += second_cabin.price_staff_full_cabin * days
        else:
            price += cabin.price_student_bed * 1 * days

        validated_data['total_price'] = price
        booking = RecreationBooking.objects.create(**validated_data)

        for g in guests_data:
            Guest.objects.create(booking=booking, **g)

        return booking

class ReceiptUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentReceipt
        fields = ['file', 'user_comment']