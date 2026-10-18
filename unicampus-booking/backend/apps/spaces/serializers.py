from rest_framework import serializers
from .models import Room, SpaceBooking


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'address', 'capacity_seats', 'amenities', 'image', 'is_active']


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