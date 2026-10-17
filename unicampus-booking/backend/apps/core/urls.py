from django.urls import path
from .views import OrganizationSettingsView

urlpatterns = [
    path('settings/', OrganizationSettingsView.as_view(), name='organization-settings'),
]