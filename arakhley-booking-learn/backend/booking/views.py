from django.db.models import Sum, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Cabin, Booking, PaymentReceipt
from .serializers import CabinSerializer, BookingCreateSerializer, ReceiptUploadSerializer
from .utils import send_booking_notification

class AvailableCabinsListView(APIView):
    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        role = request.query_params.get('role', 'STAFF')
        beds_requested = int(request.query_params.get('beds', 1))

        if not start_date_str or not end_date_str:
            return Response({"error": "Параметры обязательны."}, status=400)

        active_bookings = Booking.objects.filter(
            start_date__lt=end_date_str, end_date__gt=start_date_str
        ).exclude(status__in=[Booking.Status.CANCELLED, Booking.Status.REJECTED])

        cabin_occupancy = {c.id: 0 for c in Cabin.objects.all()}
        for b in active_bookings:
            if b.cabin_id in cabin_occupancy:
                cabin_occupancy[b.cabin_id] += b.num_beds_booked
            if b.second_cabin_id and b.second_cabin_id in cabin_occupancy:
                cabin_occupancy[b.second_cabin_id] += 4

        result = []
        for cabin in Cabin.objects.all():
            booked_count = cabin_occupancy.get(cabin.id, 0)
            is_available = False
            if cabin.is_active:
                if role == 'STAFF':
                    is_available = (booked_count == 0)
                else:
                    is_available = (booked_count + beds_requested <= 4)

            result.append({
                "id": cabin.id, "number": cabin.number, "capacity": cabin.capacity,
                "price_staff_full_cabin": cabin.price_staff_full_cabin,
                "price_student_bed": cabin.price_student_bed,
                "description": cabin.description, "booked_beds_count": booked_count,
                "is_available": is_available, "is_active": cabin.is_active
            })
        return Response(result, status=200)

# ОТКЛЮЧАЕМ CSRF ДЛЯ СОЗДАНИЯ БРОНИ
@method_decorator(csrf_exempt, name='dispatch')
class BookingCreateView(generics.CreateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer

# ОТКЛЮЧАЕМ CSRF ДЛЯ ЗАГРУЗКИ ЧЕКА
@method_decorator(csrf_exempt, name='dispatch')
class UploadReceiptView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.status != Booking.Status.PENDING_PAYMENT:
            return Response({"error": "Статус не позволяет загрузить чек."}, status=400)

        if timezone.now() > booking.expires_at:
            booking.status = Booking.Status.CANCELLED
            booking.save()
            send_booking_notification(booking, "CANCELLED")
            return Response({"error": "Срок оплаты истек."}, status=400)

        serializer = ReceiptUploadSerializer(data=request.data)
        if serializer.is_valid():
            PaymentReceipt.objects.update_or_create(
                booking=booking,
                defaults={'file': serializer.validated_data['file'], 'user_comment': serializer.validated_data.get('user_comment', '')}
            )
            booking.status = Booking.Status.RECEIPT_UPLOADED
            booking.save()
            send_booking_notification(booking, "RECEIPT_UPLOADED")
            return Response({"message": "Чек загружен."}, status=200)
        return Response(serializer.errors, status=400)

class BookingRetrieveView(generics.RetrieveAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer