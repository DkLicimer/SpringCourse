from django.urls import path

from apps.user_app.crm_user.api.GetCurrentUser import GetCurrentUser
from apps.user_app.crm_user.api.LoginApi import LoginApi
from apps.user_app.crm_user.api.RegistraziaApi import RegistraziaApi

urlpatterns = [
    path('get_current_user', GetCurrentUser.as_view(), ),
    path('login', LoginApi.as_view(), ),
    path('registration', RegistraziaApi.as_view(), ),

]