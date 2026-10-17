from django.urls import path
from .views import (
    AvailableCabinsView, 
    RecreationBookingCreateView, 
    RecreationBookingDetailView, 
    UploadReceiptView
)

urlpatterns = [
    path('cabins/available/', AvailableCabinsView.as_view(), name='available-cabins'),
    path('bookings/', RecreationBookingCreateView.as_view(), name='recreation-booking-create'),
    path('bookings/<uuid:pk>/', RecreationBookingDetailView.as_view(), name='recreation-booking-detail'),
    path('bookings/<uuid:pk>/upload-receipt/', UploadReceiptView.as_view(), name='upload-receipt'),
]