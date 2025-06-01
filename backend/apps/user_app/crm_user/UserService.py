from apps.user_app.crm_user.models import CrmUser
from core.local_settings import DONT_CHECK_USER


class UserService():
    def check_user(self, request):
        if request.user.is_anonymous:
            if DONT_CHECK_USER:
                request.user = CrmUser.objects.get(username=DONT_CHECK_USER)
            else:
                raise Exception('Необходима авторизация')

        if not request.user.is_active:
            raise Exception('Учетная запись заблокированна')



user_service = UserService()