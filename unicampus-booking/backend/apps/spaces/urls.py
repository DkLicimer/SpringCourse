from django.urls import path
from .views import RoomListView, RoomDetailView, RoomScheduleView, SpaceBookingCreateView

urlpatterns = [
    path('rooms/', RoomListView.as_view(), name='room-list'),
    path('rooms/<int:pk>/', RoomDetailView.as_view(), name='room-detail'),
    path('rooms/<int:pk>/schedule/', RoomScheduleView.as_view(), name='room-schedule'),
    path('applications/', SpaceBookingCreateView.as_view(), name='space-application-create'),
]