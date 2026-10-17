from rest_framework.views import APIView
from rest_framework.response import Response
from .models import OrganizationSettings
from .serializers import OrganizationSettingsSerializer

class OrganizationSettingsView(APIView):
    """
    Публичный эндпоинт для фронтенда. Отдает название вуза, цвета, логотип и реквизиты.
    """
    def get(self, request):
        settings_obj, _ = OrganizationSettings.objects.get_or_create(pk=1)
        serializer = OrganizationSettingsSerializer(settings_obj, context={'request': request})
        return Response(serializer.data)