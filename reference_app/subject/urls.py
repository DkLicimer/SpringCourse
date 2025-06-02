from django.urls import path

from apps.reference_app.subject.api.SubjectGetApi import SubjectGetApi

urlpatterns = [
    path('get_subject_list', SubjectGetApi.as_view(), ),
    # path('login', LoginApi.as_view(), ),
    # path('registration', RegistraziaApi.as_view(), ),

]