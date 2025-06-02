from django.urls import path

from apps.reference_app.time.api.TimeGetApi import TimeGetApi

urlpatterns = [
    path('get_time_list', TimeGetApi.as_view(), ),

]