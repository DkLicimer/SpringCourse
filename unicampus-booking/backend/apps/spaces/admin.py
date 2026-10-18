from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import redirect
from django.contrib import messages
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
    list_display = [
        'id', 'event_name', 'room', 'time_interval', 
        'applicant_full_name', 'applicant_phone', 'status_badge', 'quick_actions'
    ]
    list_filter = ['status', 'room', 'sound_engineer_required', 'start_time']
    search_fields = ['event_name', 'applicant_full_name', 'applicant_email', 'applicant_phone']
    readonly_fields = ['created_at', 'updated_at', 'direct_actions']

    fieldsets = (
        ("Управление заявкой", {
            "fields": ("direct_actions", "status", "rejection_reason")
        }),
        ("Мероприятие и аудитория", {
            "fields": ("room", "event_name", "start_time", "end_time", "sound_engineer_required")
        }),
        ("Заявитель", {
            "fields": ("applicant_full_name", "applicant_position", "applicant_email", "applicant_phone")
        }),
        ("Системная информация", {
            "classes": ("collapse",),
            "fields": ("created_at", "updated_at")
        }),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:booking_id>/approve-quick/', self.admin_site.admin_view(self.approve_quick), name='space-approve-quick'),
            path('<int:booking_id>/reject-quick/', self.admin_site.admin_view(self.reject_quick), name='space-reject-quick'),
        ]
        return custom_urls + urls

    def approve_quick(self, request, booking_id):
        b = self.get_object(request, str(booking_id))
        if b:
            b.status = SpaceBooking.Status.APPROVED
            b.save()
            NotificationService.send_email(
                subject=f"Заявка на мероприятие '{b.event_name}' одобрена",
                body=f"Здравствуйте, {b.applicant_full_name}!\n\nВаша заявка на бронирование '{b.room.name}' на {b.start_time.strftime('%d.%m.%Y %H:%M')} одобрена.",
                to_email=b.applicant_email
            )
            messages.success(request, f"Мероприятие '{b.event_name}' одобрено!")
        return redirect('admin:spaces_spacebooking_changelist')

    def reject_quick(self, request, booking_id):
        b = self.get_object(request, str(booking_id))
        if b:
            b.status = SpaceBooking.Status.REJECTED
            b.rejection_reason = "Отклонено модератором"
            b.save()
            NotificationService.send_email(
                subject=f"Заявка на мероприятие '{b.event_name}' отклонена",
                body=f"Здравствуйте, {b.applicant_full_name}!\n\nК сожалению, заявка на '{b.room.name}' была отклонена.",
                to_email=b.applicant_email
            )
            messages.warning(request, f"Мероприятие '{b.event_name}' отклонено.")
        return redirect('admin:spaces_spacebooking_changelist')

    def time_interval(self, obj):
        return f"{obj.start_time.strftime('%d.%m %H:%M')} — {obj.end_time.strftime('%H:%M')}"
    time_interval.short_description = "Время проведения"

    def status_badge(self, obj):
        colors = {
            'PENDING': '#d97706',
            'APPROVED': '#059669',
            'REJECTED': '#dc2626',
        }
        color = colors.get(obj.status, '#4b5563')
        return format_html(
            '<span style="background-color: {0}; color: white; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">{1}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Статус"

    def quick_actions(self, obj):
        if obj.status == SpaceBooking.Status.PENDING:
            url_ok = reverse('admin:space-approve-quick', args=[obj.pk])
            url_no = reverse('admin:space-reject-quick', args=[obj.pk])
            return format_html(
                '<a href="{}" style="background:#059669; color:white; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:11px; margin-right:4px;">✔ Одобрить</a>'
                '<a href="{}" style="background:#dc2626; color:white; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:11px;">✖</a>',
                url_ok, url_no
            )
        return "-"
    quick_actions.short_description = "Быстрое действие"

    def direct_actions(self, obj):
        if not obj.pk: return "-"
        if obj.status == SpaceBooking.Status.PENDING:
            url_ok = reverse('admin:space-approve-quick', args=[obj.pk])
            url_no = reverse('admin:space-reject-quick', args=[obj.pk])
            return format_html(
                '<div style="display:flex; gap:10px;">'
                '<a href="{}" style="background:#059669; color:white; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:bold;">🟢 Одобрить мероприятие</a>'
                '<a href="{}" style="background:#dc2626; color:white; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:bold;">🔴 Отклонить заявку</a>'
                '</div>',
                url_ok, url_no
            )
        return f"Заявка в статусе: {obj.get_status_display()}"
    direct_actions.short_description = "Действия с заявкой"