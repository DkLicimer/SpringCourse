from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Cabin, RecreationBooking, PaymentReceipt
from .serializers import CabinSerializer, RecreationBookingSerializer
from .services import RecreationBookingService
from .validators import validate_receipt_file


class AvailableCabinsView(APIView):
    """
    Поиск свободных домиков на выбранный диапазон дат и роль.
    Снятие просроченных броней вынесено в фоновую задачу Celery,
    здесь только быстрая фильтрация.
    """
    def get(self, request):
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        role = request.query_params.get('role', 'STAFF')

        if not start or not end:
            return Response({"error": "Укажите start_date и end_date"}, status=400)

        booked_cabin_ids = RecreationBooking.objects.filter(
            start_date__lt=end,
            end_date__gt=start
        ).exclude(
            status__in=[RecreationBooking.Status.CANCELLED, RecreationBooking.Status.REJECTED]
        ).values_list('cabin_id', flat=True)

        cabins = Cabin.objects.filter(is_active=True).order_by('number')
        result = []
        for c in cabins:
            is_avail = c.id not in booked_cabin_ids
            if role == 'STUDENT' and c.price_student_bed <= 0:
                is_avail = False

            data = CabinSerializer(c).data
            data['is_available'] = is_avail
            result.append(data)

        return Response(result)


class RecreationBookingCreateView(APIView):
    """Создание брони через безопасный сервис с блокировкой строк (select_for_update)"""
    def post(self, request):
        serializer = RecreationBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = RecreationBookingService.create_booking(serializer.validated_data)
        return Response(RecreationBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class RecreationBookingDetailView(generics.RetrieveAPIView):
    """Получение детальной информации по бронированию"""
    queryset = RecreationBooking.objects.all()
    serializer_class = RecreationBookingSerializer


class UploadReceiptView(APIView):
    """Безопасная загрузка чека с валидацией magic-bytes и размера"""
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        booking = get_object_or_404(RecreationBooking, id=pk)
        if booking.status != RecreationBooking.Status.PENDING:
            return Response({"error": "Загрузка невозможна: бронь не в статусе ожидания оплаты."}, status=400)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"file": "Файл чека обязателен."}, status=400)

        validate_receipt_file(uploaded_file)

        receipt, _ = PaymentReceipt.objects.update_or_create(
            booking=booking,
            defaults={
                'file': uploaded_file,
                'user_comment': request.data.get('user_comment', '')
            }
        )
        booking.status = RecreationBooking.Status.RECEIPT_UPLOADED
        booking.save()
        return Response({"message": "Чек успешно загружен и ожидает проверки администратором."})