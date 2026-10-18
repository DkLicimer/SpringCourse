from django.urls import path
from .views import OrganizationSettingsView, AnalyticsDashboardView

urlpatterns = [
    path('settings/', OrganizationSettingsView.as_view(), name='organization-settings'),
    path('analytics/', AnalyticsDashboardView.as_view(), name='campus-analytics'),
]