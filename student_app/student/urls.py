from django.urls import path

from apps.bludo_app.bludo.api import BludoGetApi, BludoSaveApi, BludoDeleteApi, BludoUpdatePhotoApi, BludoDeletePhotoApi
from apps.bludo_app.bludo.api.BludoCopyApi import BludoCopyApi

urlpatterns = [
     path('get',  BludoGetApi.as_view()),
     path('save',  BludoSaveApi.as_view()),
     path('delete',  BludoDeleteApi.as_view()),
     path('update_photo',  BludoUpdatePhotoApi.as_view()),
     path('delete_photo',  BludoDeletePhotoApi.as_view()),
     path('copy',  BludoCopyApi.as_view()),
]