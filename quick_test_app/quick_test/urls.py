from django.urls import path
from apps.schedule_app.schedule.api.ScheduleGetApi import ScheduleGetApi, ScheduleStatisticsApi
from apps.schedule_app.schedule.api.ScheduleGetLvApi import ScheduleGetLvApi

urlpatterns = [
    path('get/', ScheduleGetLvApi.as_view()),

    path('get/<id>', ScheduleGetApi.as_view()),
    path('statistics/<schedule_id>/', ScheduleStatisticsApi.as_view()),
]
