from django.urls import path
from .views import (
    AvailableCabinsListView, 
    BookingCreateView, 
    UploadReceiptView,
    BookingCancelView,
    BookingRetrieveView,
    GalleryPhotoListView # Импортируем вью
)

urlpatterns = [
    # Получить свободные домики на даты
    path('cabins/available/', AvailableCabinsListView.as_view(), name='available-cabins'),
    
    # Создать бронь (POST)
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    
    # Получить детали конкретной брони по её ID (GET)
    path('bookings/<uuid:pk>/', BookingRetrieveView.as_view(), name='booking-detail'),
    
    # Загрузить чек к бронированию (POST)
    path('bookings/<uuid:booking_id>/upload-receipt/', UploadReceiptView.as_view(), name='upload-receipt'),
    
    # Добровольная отмена бронирования пользователем (POST)
    path('bookings/<uuid:booking_id>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    
    # Список фотографий для галереи главной страницы (GET)
    path('gallery/', GalleryPhotoListView.as_view(), name='gallery-list'),
]