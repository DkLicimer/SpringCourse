from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Cabin, Booking, PaymentReceipt
from .serializers import CabinSerializer, BookingCreateSerializer, ReceiptUploadSerializer
from .utils import send_booking_notification


class AvailableCabinsListView(APIView):
    """Эндпоинт для получения списка домиков с информацией об их занятости на даты"""
    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        role = request.query_params.get('role', 'STAFF')
        beds_requested = int(request.query_params.get('beds', 1))

        if not start_date_str or not end_date_str:
            return Response(
                {"error": "Параметры start_date and end_date обязательны."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Выгружаем активные бронирования на эти даты
        active_bookings = Booking.objects.filter(
            start_date__lt=end_date_str,
            end_date__gt=start_date_str
        ).exclude(
            status__in=[Booking.Status.CANCELLED, Booking.Status.REJECTED]
        )

        # Считаем койки в памяти
        cabin_booked_beds = {c.id: 0 for c in Cabin.objects.all()}
        for b in active_bookings:
            if b.cabin_id in cabin_booked_beds:
                cabin_booked_beds[b.cabin_id] += b.num_beds_booked
            if b.second_cabin_id and b.second_cabin_id in cabin_booked_beds:
                cabin_booked_beds[b.second_cabin_id] += 4

        result = []
        # Выбираем абсолютно все домики из базы
        for cabin in Cabin.objects.all():
            booked_count = cabin_booked_beds.get(cabin.id, 0)
            
            is_available = False
            # Домик доступен для бронирования ТОЛЬКО если он активен (is_active=True)
            if cabin.is_active:
                if role == 'STAFF':
                    is_available = (booked_count == 0)
                else:
                    is_available = (booked_count + beds_requested <= 4)

            result.append({
                "id": cabin.id,
                "number": cabin.number,
                "capacity": cabin.capacity,
                "price_staff_full_cabin": cabin.price_staff_full_cabin,
                "price_student_bed": cabin.price_student_bed,
                "description": cabin.description,
                "booked_beds_count": booked_count,
                "is_available": is_available,
                "is_active": cabin.is_active
            })

        return Response(result, status=status.HTTP_200_OK)


class BookingCreateView(generics.CreateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer


class UploadReceiptView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)

        if booking.status != Booking.Status.PENDING_PAYMENT:
            return Response(
                {"error": "Данное бронирование не ожидает оплаты."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if timezone.now() > booking.expires_at:
            booking.status = Booking.Status.CANCELLED
            booking.save()
            send_booking_notification(booking, "CANCELLED")
            return Response(
                {"error": "Время на оплату истекло. Бронирование автоматически отменено."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReceiptUploadSerializer(data=request.data)
        if serializer.is_valid():
            PaymentReceipt.objects.update_or_create(
                booking=booking,
                defaults={
                    'file': serializer.validated_data['file'],
                    'user_comment': serializer.validated_data.get('user_comment', '')
                }
            )
            
            booking.status = Booking.Status.RECEIPT_UPLOADED
            booking.save()

            send_booking_notification(booking, "RECEIPT_UPLOADED")

            return Response(
                {"message": "Чек успешно загружен. Ожидайте подтверждения оплаты администратором."},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class BookingRetrieveView(generics.RetrieveAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer