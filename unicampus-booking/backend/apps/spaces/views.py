from datetime import datetime
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Room, SpaceBooking
from .serializers import RoomSerializer, SpaceScheduleItemSerializer, SpaceBookingCreateSerializer
from apps.notifications.services import NotificationService

class RoomListView(generics.ListAPIView):
    queryset = Room.objects.filter(is_active=True)
    serializer_class = RoomSerializer


class RoomDetailView(generics.RetrieveAPIView):
    queryset = Room.objects.filter(is_active=True)
    serializer_class = RoomSerializer


class RoomScheduleView(APIView):
    """Расписание одобренных броней помещения на диапазон дат"""
    def get(self, request, pk):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        bookings = SpaceBooking.objects.filter(
            room_id=pk,
            status=SpaceBooking.Status.APPROVED
        )

        if start_date and end_date:
            bookings = bookings.filter(start_time__date__gte=start_date, start_time__date__lte=end_date)

        serializer = SpaceScheduleItemSerializer(bookings, many=True)
        return Response(serializer.data)


class SpaceBookingCreateView(generics.CreateAPIView):
    queryset = SpaceBooking.objects.all()
    serializer_class = SpaceBookingCreateSerializer

    def perform_create(self, serializer):
        booking = serializer.save()
        NotificationService.send_email(
            subject=f"Заявка #{booking.id} принята в обработку",
            body=(
                f"Здравствуйте, {booking.applicant_full_name}!\n\n"
                f"Ваша заявка на мероприятие '{booking.event_name}' в помещении '{booking.room.name}' принята.\n"
                f"Ожидайте подтверждения администратора."
            ),
            to_email=booking.applicant_email
        )