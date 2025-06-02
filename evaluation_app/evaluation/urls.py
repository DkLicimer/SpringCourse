from django.urls import path

from apps.evaluation_app.evaluation.api import EvaluationGetApi

urlpatterns = [
     path('get',  EvaluationGetApi.as_view()),
]