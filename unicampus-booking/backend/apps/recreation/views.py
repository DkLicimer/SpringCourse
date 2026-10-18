from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import RecreationBooking, PaymentReceipt
from .validators import validate_receipt_file

class UploadReceiptView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        booking = get_object_or_404(RecreationBooking, id=pk)
        if booking.status != RecreationBooking.Status.PENDING:
            return Response({"error": "Загрузка невозможна: бронь не в статусе ожидания оплаты."}, status=400)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"file": "Файл чека обязателен."}, status=400)

        # Валидация magic bytes и размера
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