import random
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .models import OrganizationSettings
from .serializers import OrganizationSettingsSerializer
from apps.spaces.models import SpaceBooking, Room
from apps.recreation.models import RecreationBooking
from apps.notifications.tasks import send_email_async_task

User = get_user_model()


class OrganizationSettingsView(APIView):
    """Публичные настройки университета и брендинга"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        settings_obj, _ = OrganizationSettings.objects.get_or_create(pk=1)
        serializer = OrganizationSettingsSerializer(settings_obj, context={'request': request})
        return Response(serializer.data)


class AnalyticsDashboardView(APIView):
    """Сводная аналитика: доступ только администраторам"""
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_space_apps = SpaceBooking.objects.count()
        approved_space_apps = SpaceBooking.objects.filter(status=SpaceBooking.Status.APPROVED).count()
        pending_space_apps = SpaceBooking.objects.filter(status=SpaceBooking.Status.PENDING).count()

        room_popularity = (
            Room.objects.filter(bookings__status=SpaceBooking.Status.APPROVED)
            .annotate(approved_count=models.Count('bookings'))
            .values('name', 'approved_count')
            .order_by('-approved_count')[:5]
        )

        total_rec_bookings = RecreationBooking.objects.count()
        confirmed_rec_bookings = RecreationBooking.objects.filter(status=RecreationBooking.Status.CONFIRMED).count()
        total_revenue = (
            RecreationBooking.objects.filter(status=RecreationBooking.Status.CONFIRMED)
            .aggregate(total=models.Sum('total_price'))['total'] or 0
        )

        return Response({
            "spaces": {
                "total": total_space_apps,
                "approved": approved_space_apps,
                "pending": pending_space_apps,
                "popular_rooms": list(room_popularity)
            },
            "recreation": {
                "total": total_rec_bookings,
                "confirmed": confirmed_rec_bookings,
                "revenue_rub": float(total_revenue)
            }
        })


class RequestOTPView(APIView):
    """Отправка 6-значного одноразового кода на почту"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email or '@' not in email:
            return Response({"error": "Укажите корректный корпоративный Email."}, status=400)

        otp = f"{random.randint(100000, 999999)}"
        cache.set(f"otp_{email}", otp, timeout=300)  # 5 минут

        send_email_async_task.delay(
            subject="Код входа в UniCampus",
            body=f"Ваш одноразовый код для входа: {otp}. Действителен 5 минут.",
            to_email=email
        )
        return Response({"message": "Код подтверждения отправлен на почту."})


class VerifyOTPView(APIView):
    """Верификация OTP и выпуск JWT токенов"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        cached_otp = cache.get(f"otp_{email}")

        if not cached_otp or cached_otp != otp:
            return Response({"error": "Неверный или просроченный код."}, status=400)

        cache.delete(f"otp_{email}")
        user, _ = User.objects.get_or_create(username=email, defaults={'email': email})
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "email": email
        })


class MyBookingsView(APIView):
    """Список бронирований авторизованного пользователя"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        email = request.user.email
        spaces = SpaceBooking.objects.filter(applicant_email=email).order_by('-created_at')
        recreations = RecreationBooking.objects.filter(contact_email=email).order_by('-created_at')

        return Response({
            "spaces": [{
                "id": s.id,
                "room": s.room.name,
                "event": s.event_name,
                "start": s.start_time,
                "end": s.end_time,
                "status": s.status
            } for s in spaces],
            "recreation": [{
                "id": str(r.id),
                "number": r.booking_number,
                "cabin": r.cabin.number,
                "start": r.start_date,
                "end": r.end_date,
                "status": r.status,
                "price": str(r.total_price)
            } for r in recreations]
        })