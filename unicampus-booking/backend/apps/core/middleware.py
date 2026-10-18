import zoneinfo
from django.utils import timezone
from .models import OrganizationSettings

class UniversityTimezoneMiddleware:
    """
    Активирует часовой пояс, заданный в настройках университета в БД,
    для корректного рендеринга дат в админке и API.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            settings_obj = OrganizationSettings.objects.first()
            tzname = settings_obj.timezone if settings_obj and settings_obj.timezone else 'Asia/Chita'
            timezone.activate(zoneinfo.ZoneInfo(tzname))
        except Exception:
            timezone.deactivate()

        response = self.get_response(request)
        return response