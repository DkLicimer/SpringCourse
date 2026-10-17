from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Cabin, RecreationBooking, PaymentReceipt
from .serializers import CabinSerializer, RecreationBookingSerializer, ReceiptUploadSerializer
from .pdf import generate_voucher_pdf
from apps.notifications.services import NotificationService

class AvailableCabinsView(APIView):
    def get(self, request):
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        role = request.query_params.get('role', 'STAFF')

        if not start or not end:
            return Response({"error": "Укажите start_date и end_date"}, status=400)

        # Отменяем просроченные брони на лету
        RecreationBooking.objects.filter(
            status=RecreationBooking.Status.PENDING,
            expires_at__lt=timezone.now()
        ).update(status=RecreationBooking.Status.CANCELLED)

        booked_cabin_ids = RecreationBooking.objects.filter(
            start_date__lt=end,
            end_date__gt=start
        ).exclude(
            status__in=[RecreationBooking.Status.CANCELLED, RecreationBooking.Status.REJECTED]
        ).values_list('cabin_id', flat=True)

        cabins = Cabin.objects.filter(is_active=True)
        result = []
        for c in cabins:
            is_avail = c.id not in booked_cabin_ids
            if role == 'STUDENT' and c.price_student_bed <= 0:
                is_avail = False
            
            data = CabinSerializer(c).data
            data['is_available'] = is_avail
            result.append(data)

        return Response(result)

class RecreationBookingCreateView(generics.CreateAPIView):
    queryset = RecreationBooking.objects.all()
    serializer_class = RecreationBookingSerializer

class RecreationBookingDetailView(generics.RetrieveAPIView):
    queryset = RecreationBooking.objects.all()
    serializer_class = RecreationBookingSerializer

class UploadReceiptView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        booking = get_object_or_404(RecreationBooking, id=pk)
        if booking.status != RecreationBooking.Status.PENDING:
            return Response({"error": "Чек уже загружен или бронь аннулирована"}, status=400)

        serializer = ReceiptUploadSerializer(data=request.data)
        if serializer.is_valid():
            PaymentReceipt.objects.update_or_create(
                booking=booking,
                defaults={
                    'file': serializer.validated_data['file'],
                    'user_comment': serializer.validated_data.get('user_comment', '')
                }
            )
            booking.status = RecreationBooking.Status.RECEIPT_UPLOADED
            booking.save()
            return Response({"message": "Чек успешно отправлен на проверку!"})
        return Response(serializer.errors, status=400)