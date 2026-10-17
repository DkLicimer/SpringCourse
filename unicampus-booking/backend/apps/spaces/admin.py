from django.contrib import admin
from django.utils.html import format_html
from .models import Room, SpaceBooking
from apps.notifications.services import NotificationService

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'address', 'capacity', 'is_active', 'image_preview']
    list_editable = ['is_active']
    search_fields = ['name', 'address']

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 40px; border-radius: 4px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Превью"


@admin.register(SpaceBooking)
class SpaceBookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'event_name', 'room', 'start_time', 'end_time', 'applicant_full_name', 'status', 'sound_engineer_required']
    list_filter = ['status', 'room', 'sound_engineer_required', 'start_time']
    search_fields = ['event_name', 'applicant_full_name', 'applicant_email', 'applicant_phone']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['approve_bookings', 'reject_bookings']

    def approve_bookings(self, request, queryset):
        for booking in queryset.filter(status=SpaceBooking.Status.PENDING):
            booking.status = SpaceBooking.Status.APPROVED
            booking.save()
            NotificationService.send_email(
                subject=f"Заявка на мероприятие '{booking.event_name}' одобрена",
                body=f"Здравствуйте, {booking.applicant_full_name}!\n\nВаша заявка на бронирование '{booking.room.name}' на {booking.start_time.strftime('%d.%m.%Y %H:%M')} успешно одобрена.",
                to_email=booking.applicant_email
            )
        self.message_user(request, "Выбранные заявки успешно одобрены!")
    approve_bookings.short_description = "🟢 Одобрить выбранные заявки"

    def reject_bookings(self, request, queryset):
        for booking in queryset.filter(status=SpaceBooking.Status.PENDING):
            booking.status = SpaceBooking.Status.REJECTED
            booking.rejection_reason = "Отклонено администратором"
            booking.save()
            NotificationService.send_email(
                subject=f"Заявка на мероприятие '{booking.event_name}' отклонена",
                body=f"Здравствуйте, {booking.applicant_full_name}!\n\nК сожалению, заявка на '{booking.room.name}' была отклонена.",
                to_email=booking.applicant_email
            )
        self.message_user(request, "Выбранные заявки отклонены.")
    reject_bookings.short_description = "🔴 Отклонить выбранные заявки"