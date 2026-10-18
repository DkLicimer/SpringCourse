from django.db.models import Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import OrganizationSettings
from .serializers import OrganizationSettingsSerializer
from apps.spaces.models import SpaceBooking, Room
from apps.recreation.models import RecreationBooking

class OrganizationSettingsView(APIView):
    authentication_classes = []
    def get(self, request):
        settings_obj, _ = OrganizationSettings.objects.get_or_create(pk=1)
        serializer = OrganizationSettingsSerializer(settings_obj, context={'request': request})
        return Response(serializer.data)

class AnalyticsDashboardView(APIView):
    """
    Сводная аналитика по кампусу и базам отдыха для руководства вуза.
    """
    authentication_classes = []

    def get(self, request):
        # Аудитории
        total_space_apps = SpaceBooking.objects.count()
        approved_space_apps = SpaceBooking.objects.filter(status=SpaceBooking.Status.APPROVED).count()
        pending_space_apps = SpaceBooking.objects.filter(status=SpaceBooking.Status.PENDING).count()

        room_popularity = (
            Room.objects.filter(bookings__status=SpaceBooking.Status.APPROVED)
            .annotate(approved_count=Count('bookings'))
            .values('name', 'approved_count')
            .order_by('-approved_count')[:5]
        )

        # Базы отдыха
        total_rec_bookings = RecreationBooking.objects.count()
        confirmed_rec_bookings = RecreationBooking.objects.filter(status=RecreationBooking.Status.CONFIRMED).count()
        total_revenue = (
            RecreationBooking.objects.filter(status=RecreationBooking.Status.CONFIRMED)
            .aggregate(total=Sum('total_price'))['total'] or 0
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