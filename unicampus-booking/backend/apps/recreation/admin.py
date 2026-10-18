from django.contrib import admin
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import redirect
from django.contrib import messages
from .models import Cabin, RecreationBooking, Guest, PaymentReceipt
from .pdf import generate_voucher_pdf
from apps.notifications.services import NotificationService

class GuestInline(admin.TabularInline):
    model = Guest
    extra = 0
    verbose_name = "Отдыхающий"
    verbose_name_plural = "Список отдыхающих"

class PaymentReceiptInline(admin.StackedInline):
    model = PaymentReceipt
    extra = 0
    readonly_fields = ['uploaded_at', 'receipt_preview']

    def receipt_preview(self, obj):
        if obj.file:
            url = obj.file.url
            if url.lower().endswith(('.png', '.jpg', '.jpeg')):
                return format_html(
                    '<a href="{0}" target="_blank"><img src="{0}" style="max-height: 250px; border-radius: 8px; border: 1px solid #ccc;" /></a>', 
                    url
                )
            return format_html('<a href="{}" target="_blank" style="font-weight:bold; color:#2563eb;">📄 Открыть PDF-документ чека</a>', url)
        return "Чек еще не прикреплен"
    receipt_preview.short_description = "Просмотр квитанции"

@admin.register(Cabin)
class CabinAdmin(admin.ModelAdmin):
    list_display = ['number', 'title', 'category', 'capacity', 'price_staff_full_cabin', 'price_student_bed', 'is_active']
    list_editable = ['price_staff_full_cabin', 'price_student_bed', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['number', 'title']

@admin.register(RecreationBooking)
class RecreationBookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_number', 'contact_name', 'user_role', 'dates_display', 
        'total_price_display', 'status_badge', 'receipt_thumbnail', 'quick_actions'
    ]
    list_filter = ['status', 'user_role', 'start_date']
    search_fields = ['booking_number', 'contact_name', 'contact_email', 'contact_phone']
    readonly_fields = ['booking_number', 'created_at', 'expires_at', 'total_price', 'direct_actions']
    inlines = [GuestInline, PaymentReceiptInline]

    fieldsets = (
        ("Управление бронью", {
            "fields": ("direct_actions", "status", "booking_number")
        }),
        ("Детали размещения", {
            "fields": ("cabin", "second_cabin", "user_role", "start_date", "end_date", "total_price")
        }),
        ("Контакты заявителя", {
            "fields": ("contact_name", "contact_phone", "contact_email", "department", "position", "faculty", "academic_group")
        }),
        ("Системная информация", {
            "classes": ("collapse",),
            "fields": ("created_at", "expires_at")
        }),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<uuid:booking_id>/approve-quick/', self.admin_site.admin_view(self.approve_quick), name='rec-approve-quick'),
            path('<uuid:booking_id>/reject-quick/', self.admin_site.admin_view(self.reject_quick), name='rec-reject-quick'),
        ]
        return custom_urls + urls

    def approve_quick(self, request, booking_id):
        b = self.get_object(request, str(booking_id))
        if b:
            b.status = RecreationBooking.Status.CONFIRMED
            b.save()
            pdf_bytes = generate_voucher_pdf(b)
            NotificationService.send_email(
                subject=f"Путёвка на базу отдыха № {b.booking_number}",
                body=f"Здравствуйте, {b.contact_name}!\n\nОплата подтверждена. Официальная путёвка прикреплена к письму.",
                to_email=b.contact_email,
                attachments=[(f"Voucher_{b.booking_number}.pdf", pdf_bytes, "application/pdf")]
            )
            messages.success(request, f"Бронь {b.booking_number} подтверждена, путёвка отправлена на {b.contact_email}!")
        return redirect('admin:recreation_recreationbooking_changelist')

    def reject_quick(self, request, booking_id):
        b = self.get_object(request, str(booking_id))
        if b:
            b.status = RecreationBooking.Status.REJECTED
            b.save()
            NotificationService.send_email(
                subject=f"Оплата бронирования {b.booking_number} отклонена",
                body=f"Здравствуйте, {b.contact_name}!\n\nК сожалению, оплата не была подтверждена бухгалтерией.",
                to_email=b.contact_email
            )
            messages.warning(request, f"Бронь {b.booking_number} отклонена.")
        return redirect('admin:recreation_recreationbooking_changelist')

    def dates_display(self, obj):
        return f"{obj.start_date.strftime('%d.%m')} — {obj.end_date.strftime('%d.%m.%Y')}"
    dates_display.short_description = "Даты"

    def total_price_display(self, obj):
        return f"{obj.total_price} ₽"
    total_price_display.short_description = "Сумма"

    def status_badge(self, obj):
        colors = {
            'PENDING': '#d97706',
            'RECEIPT_UPLOADED': '#2563eb',
            'CONFIRMED': '#059669',
            'CANCELLED': '#dc2626',
            'REJECTED': '#7f1d1d',
        }
        color = colors.get(obj.status, '#4b5563')
        return format_html(
            '<span style="background-color: {0}; color: white; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">{1}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Статус"

    def receipt_thumbnail(self, obj):
        if hasattr(obj, 'receipt') and obj.receipt.file:
            url = obj.receipt.file.url
            if url.lower().endswith(('.png', '.jpg', '.jpeg')):
                return format_html('<a href="{0}" target="_blank"><img src="{0}" style="max-height: 38px; border-radius: 4px; border: 1px solid #ddd;" /></a>', url)
            return format_html('<a href="{0}" target="_blank" style="font-size: 11px; font-weight:bold; color:#2563eb;">PDF чек</a>', url)
        return format_html('<span style="color:#aaa; font-size: 11px;">Нет чека</span>')
    receipt_thumbnail.short_description = "Чек"

    def quick_actions(self, obj):
        if obj.status in [RecreationBooking.Status.PENDING, RecreationBooking.Status.RECEIPT_UPLOADED]:
            url_ok = reverse('admin:rec-approve-quick', args=[obj.pk])
            url_no = reverse('admin:rec-reject-quick', args=[obj.pk])
            return format_html(
                '<a href="{}" style="background:#059669; color:white; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:11px; margin-right:4px;">✔ Одобрить</a>'
                '<a href="{}" style="background:#dc2626; color:white; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold; font-size:11px;">✖</a>',
                url_ok, url_no
            )
        return "-"
    quick_actions.short_description = "Быстрое действие"

    def direct_actions(self, obj):
        if not obj.pk: return "-"
        if obj.status in [RecreationBooking.Status.PENDING, RecreationBooking.Status.RECEIPT_UPLOADED]:
            url_ok = reverse('admin:rec-approve-quick', args=[obj.pk])
            url_no = reverse('admin:rec-reject-quick', args=[obj.pk])
            return format_html(
                '<div style="display:flex; gap:10px;">'
                '<a href="{}" style="background:#059669; color:white; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:bold;">🟢 Подтвердить оплату и выслать PDF-путёвку</a>'
                '<a href="{}" style="background:#dc2626; color:white; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:bold;">🔴 Отклонить оплату</a>'
                '</div>',
                url_ok, url_no
            )
        return f"Заявка в статусе: {obj.get_status_display()}"
    direct_actions.short_description = "Действия с заявкой"