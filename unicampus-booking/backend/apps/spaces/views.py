from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Room, SpaceBooking
from .serializers import RoomSerializer, SpaceScheduleItemSerializer, SpaceBookingCreateSerializer
from .services import SpaceBookingService


class RoomListView(generics.ListAPIView):
    queryset = Room.objects.filter(is_active=True)
    serializer_class = RoomSerializer
    pagination_class = None


class RoomDetailView(generics.RetrieveAPIView):
    queryset = Room.objects.filter(is_active=True)
    serializer_class = RoomSerializer


class RoomScheduleView(APIView):
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


@method_decorator(csrf_exempt, name='dispatch')
class SpaceBookingCreateView(generics.CreateAPIView):
    queryset = SpaceBooking.objects.all()
    serializer_class = SpaceBookingCreateSerializer
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = SpaceBookingService.create_booking(serializer.validated_data)
        return Response(self.get_serializer(booking).data, status=status.HTTP_201_CREATED)