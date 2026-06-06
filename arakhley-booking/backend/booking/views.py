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


class AvailableCabinsListView(APIView):
    """
    Эндпоинт для получения списка домиков с информацией об их занятости.
    Пример запроса: GET /api/cabins/available/?start_date=2026-06-15&end_date=2026-06-19&role=STUDENT&beds=1
    """
    def get(self, request):
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        role = request.query_params.get('role', 'STAFF')
        beds_requested = int(request.query_params.get('beds', 1))

        if not start_date_str or not end_date_str:
            return Response(
                {"error": "Параметры start_date и end_date обязательны."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Аннотируем каждый домик суммой занятых койко-мест на указанные даты
        cabins = Cabin.objects.filter(is_active=True).annotate(
            booked_beds=Coalesce(
                Sum(
                    'bookings__num_beds_booked',
                    filter=Q(
                        bookings__start_date__lt=end_date_str,
                        bookings__end_date__gt=start_date_str
                    ) & ~Q(
                        bookings__status__in=[Booking.Status.CANCELLED, Booking.Status.REJECTED]
                    )
                ),
                0
            )
        )

        result = []
        for cabin in cabins:
            # Логика определения статуса доступности домика
            is_available = False
            if role == 'STAFF':
                # Для сотрудника домик доступен, только если занято ровно 0 мест
                is_available = (cabin.booked_beds == 0)
            else: # STUDENT
                # Для студента доступен, если поместится запрашиваемое кол-во мест
                is_available = (cabin.booked_beds + beds_requested <= 4)

            result.append({
                "id": cabin.id,
                "number": cabin.number,
                "capacity": cabin.capacity,
                "price_staff_full_cabin": cabin.price_staff_full_cabin,
                "price_student_bed": cabin.price_student_bed,
                "description": cabin.description,
                "booked_beds_count": cabin.booked_beds,
                "is_available": is_available
            })

        return Response(result, status=status.HTTP_200_ONLY if 'rest_framework' in globals() else status.HTTP_200_OK)


class BookingCreateView(generics.CreateAPIView):
    """Эндпоинт создания бронирования"""
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer


class UploadReceiptView(APIView):
    """
    Эндпоинт для загрузки чека пользователем.
    Доступен по уникальному ID (UUID) бронирования.
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)

        # Проверяем, можно ли сейчас прикрепить чек
        if booking.status != Booking.Status.PENDING_PAYMENT:
            return Response(
                {"error": "Данное бронирование не ожидает оплаты."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Проверка таймаута бронирования (1 час)
        if timezone.now() > booking.expires_at:
            booking.status = Booking.Status.CANCELLED
            booking.save()
            return Response(
                {"error": "Время на оплату истекло. Бронирование автоматически отменено."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReceiptUploadSerializer(data=request.data)
        if serializer.is_valid():
            # Если чек уже загружался ранее, перезаписываем его
            PaymentReceipt.objects.update_or_create(
                booking=booking,
                defaults={
                    'file': serializer.validated_data['file'],
                    'user_comment': serializer.validated_data.get('user_comment', '')
                }
            )
            
            # Переводим статус бронирования
            booking.status = Booking.Status.RECEIPT_UPLOADED
            booking.save()

            return Response(
                {"message": "Чек успешно загружен. Ожидайте подтверждения оплаты администратором."},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class BookingRetrieveView(generics.RetrieveAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingCreateSerializer