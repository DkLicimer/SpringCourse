from django.urls import path

from apps.reference_app.group.api.GroupGetApi import GroupGetApi

urlpatterns = [
    path('get_group_list', GroupGetApi.as_view(), ),
    # path('login', LoginApi.as_view(), ),
    # path('registration', RegistraziaApi.as_view(), ),

]