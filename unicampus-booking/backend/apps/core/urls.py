from django.urls import path
from .views import (
    OrganizationSettingsView,
    AnalyticsDashboardView,
    RequestOTPView,
    VerifyOTPView,
    MyBookingsView
)

urlpatterns = [
    path('settings/', OrganizationSettingsView.as_view(), name='organization-settings'),
    path('analytics/', AnalyticsDashboardView.as_view(), name='campus-analytics'),
    path('auth/request-otp/', RequestOTPView.as_view(), name='request-otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('my-bookings/', MyBookingsView.as_view(), name='my-bookings'),
]