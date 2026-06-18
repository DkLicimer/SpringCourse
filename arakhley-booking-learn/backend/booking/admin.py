import csv
from django.contrib import admin
from django.http import HttpResponse
from django.utils import timezone
from django.utils.html import format_html
from django.urls import path, reverse
from django.shortcuts import redirect
from django.contrib import messages
from .models import Cabin, Booking, Guest, PaymentReceipt
from .utils import send_booking_notification


class GuestInline(admin.TabularInline):
    model = Guest
    extra = 0
    verbose_name = "Отдыхающий"
    verbose_name_plural = "Список отдыхающих"


class PaymentReceiptInline(admin.StackedInline):
    model = PaymentReceipt
    extra = 0
    readonly_fields = ['uploaded_at', 'image_preview']
    verbose_name = "Чек об оплате"
    verbose_name_plural = "Подтверждение оплаты"
    
    def image_preview(self, obj):
        if obj.file:
            url = obj.file.url
            ext = url.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png']:
                return format_html(
                    '<img src="{0}" style="max-height: 320px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />',
                    url
                )
            return format_html('<a href="{0}" target="_blank" style="font-weight: bold; color: #2563eb;">📎 Открыть квитанцию PDF в новой вкладке</a>', url)
        return "Файл чека не прикреплен"
    image_preview.short_description = "Интерактивный просмотр чека"


@admin.register(Cabin)
class CabinAdmin(admin.ModelAdmin):
    list_display = ['number', 'capacity', 'price_staff_full_cabin', 'price_student_bed', 'is_active']
    list_editable = ['price_staff_full_cabin', 'price_student_bed', 'is_active']
    list_filter = ['is_active', 'capacity']
    search_fields = ['number']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_number', 'contact_name', 'user_role', 'cabin_info', 
        'start_date', 'end_date', 'total_price', 'status_badge', 'receipt_thumbnail', 'created_at'
    ]
    
    list_filter = ['status', 'user_role', 'start_date', 'cabin']
    search_fields = ['booking_number', 'contact_name', 'contact_email', 'contact_phone']
    
    readonly_fields = ['booking_number', 'created_at', 'expires_at', 'total_price', 'quick_actions']
    
    inlines = [GuestInline, PaymentReceiptInline]
    
    fieldsets = (
        ('Быстрое управление и статус', {
            'fields': ('quick_actions', 'status', 'booking_number'),
            'description': 'Основная панель для мгновенного подтверждения или отклонения оплаты.'
        }),
        ('Детали проживания и стоимость', {
            'fields': ('cabin', 'second_cabin', 'num_beds_booked', 'start_date', 'end_date', 'total_price'),
            'description': 'Информация о выбранных объектах размещения, датах заезда и итоговой сумме к получению.'
        }),
        ('Контактные данные заявителя', {
            'fields': ('contact_name', 'user_role', 'contact_phone', 'contact_email')
        }),
        ('Академические / Должностные данные ЗабГУ', {
            'fields': ('department', 'position', 'faculty', 'academic_group'),
            'description': 'Данные о принадлежности гостя к структуре университета.'
        }),
        ('Системные метки времени (свернуто)', {
            'fields': ('created_at', 'expires_at'),
            'classes': ('collapse',),
            'description': 'Служебная информация о создании и дедлайне брони.'
        }),
    )

    actions = ['confirm_payment_action', 'reject_payment_action', 'export_to_csv']

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<uuid:booking_id>/approve-direct/',
                self.admin_site.admin_view(self.approve_direct),
                name='booking-approve-direct',
            ),
            path(
                '<uuid:booking_id>/reject-direct/',
                self.admin_site.admin_view(self.reject_direct),
                name='booking-reject-direct',
            ),
        ]
        return custom_urls + urls

    def cabin_info(self, obj):
        if obj.second_cabin:
            return f"Домики №{obj.cabin.number}, №{obj.second_cabin.number}"
        return f"Домик №{obj.cabin.number}"
    cabin_info.short_description = "Размещение"

    def approve_direct(self, request, booking_id):
        booking = self.get_object(request, str(booking_id))
        if booking:
            if booking.status in [Booking.Status.PENDING_PAYMENT, Booking.Status.RECEIPT_UPLOADED]:
                booking.status = Booking.Status.CONFIRMED
                booking.save()
                send_booking_notification(booking, "CONFIRMED")
                messages.success(
                    request, 
                    format_html("Бронирование <b>{0}</b> успешно одобрено! Официальная путевка отправлена на email: <b>{1}</b>.", booking.booking_number, booking.contact_email)
                )
            else:
                messages.warning(
                    request, 
                    f"Бронирование {booking.booking_number} уже имеет статус: {booking.get_status_display()}."
                )
        return redirect('admin:booking_booking_change', booking_id)

    def reject_direct(self, request, booking_id):
        booking = self.get_object(request, str(booking_id))
        if booking:
            if booking.status in [Booking.Status.PENDING_PAYMENT, Booking.Status.RECEIPT_UPLOADED]:
                booking.status = Booking.Status.REJECTED
                booking.save()
                send_booking_notification(booking, "REJECTED")
                messages.error(
                    request, 
                    format_html("Оплата по бронированию <b>{0}</b> успешно отклонена.", booking.booking_number)
                )
            else:
                messages.warning(
                    request, 
                    f"Бронирование {booking.booking_number} уже имеет статус: {booking.get_status_display()}."
                )
        return redirect('admin:booking_booking_change', booking_id)

    def quick_actions(self, obj):
        if not obj.pk:
            return format_html('<span style="color: #9ca3af; font-style: italic;">Доступно после сохранения</span>')
            
        if obj.status in [Booking.Status.PENDING_PAYMENT, Booking.Status.RECEIPT_UPLOADED]:
            url_approve = reverse('admin:booking-approve-direct', args=[obj.pk])
            url_reject = reverse('admin:booking-reject-direct', args=[obj.pk])
            return format_html(
                '<div style="display: flex; gap: 12px; align-items: center;">'
                '  <a class="button" href="{0}" style="background-color: #059669; color: white; padding: 10px 18px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(5,150,105,0.15); transition: all 0.15s;">'
                '    🟢 Одобрить и отправить путевку в 1 клик'
                '  </a>'
                '  <a class="button" href="{1}" style="background-color: #dc2626; color: white; padding: 10px 18px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(220,38,38,0.15); transition: all 0.15s;">'
                '    🔴 Отклонить оплату'
                '  </a>'
                '</div>',
                url_approve,
                url_reject
            )
        elif obj.status in ['CONFIRMED', 'PAYMENT_CONFIRMED']:
            return format_html(
                '<div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 10px 15px; border-radius: 6px; font-weight: bold; display: inline-block;">'
                '✅ Бронирование подтверждено! Путевка сформирована и отправлена на email.'
                '</div>'
            )
        elif obj.status == 'REJECTED':
            return format_html(
                '<div style="background-color: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; padding: 10px 15px; border-radius: 6px; font-weight: bold; display: inline-block;">'
                '❌ Оплата по бронированию была отклонена администратором.'
                '</div>'
            )
        return format_html(
            '<span style="color: #6b7280; font-style: italic; font-size: 13px;">Быстрое управление недоступно в текущем статусе ({0})</span>',
            obj.get_status_display()
        )
    quick_actions.short_description = "Быстрые действия"

    def status_badge(self, obj):
        colors = {
            'PENDING': '#d97706',
            'RECEIPT_UPLOADED': '#2563eb',
            'CONFIRMED': '#059669',
            'PAYMENT_CONFIRMED': '#059669',
            'CANCELLED': '#dc2626',
            'REJECTED': '#7c2d12',
        }
        color = colors.get(obj.status, '#4b5563')
        return format_html(
            '<span style="background-color: {0}; color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase;">{1}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = "Статус заявки"

    def receipt_thumbnail(self, obj):
        if hasattr(obj, 'receipt') and obj.receipt.file:
            url = obj.receipt.file.url
            ext = url.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png']:
                return format_html(
                    '<a href="{0}" target="_blank"><img src="{0}" style="max-height: 42px; border-radius: 4px; border: 1px solid #ccc; padding: 1px;" /></a>',
                    url
                )
            return format_html('<a href="{0}" target="_blank" style="font-weight: bold; color: #2563eb; font-size: 11px;">📂 Открыть PDF</a>', url)
        return format_html('<span style="color: #9ca3af; font-style: italic; font-size: 11px;">Не загружен</span>')
    receipt_thumbnail.short_description = "Квитанция"

    def confirm_payment_action(self, request, queryset):
        count = 0
        for booking in queryset:
            if booking.status in [Booking.Status.PENDING_PAYMENT, Booking.Status.RECEIPT_UPLOADED]:
                booking.status = Booking.Status.CONFIRMED
                booking.save()
                send_booking_notification(booking, "CONFIRMED")
                count += 1
                
        self.message_user(request, f"Успешно подтверждено бронирований: {count}. Путевки с подписями отправлены на email.")
    confirm_payment_action.short_description = "🟢 Подтвердить оплату и отправить путевку"

    def reject_payment_action(self, request, queryset):
        count = 0
        for booking in queryset:
            if booking.status in [Booking.Status.PENDING_PAYMENT, Booking.Status.RECEIPT_UPLOADED]:
                booking.status = Booking.Status.REJECTED
                booking.save()
                send_booking_notification(booking, "REJECTED")
                count += 1
        self.message_user(request, f"Отклонено бронирований: {count}.")
    reject_payment_action.short_description = "🔴 Отклонить оплату"

    def export_to_csv(self, request, queryset):
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename=bookings_export_{timezone.now().strftime("%Y%m%d")}.csv'
        
        response.write(u'\ufeff'.encode('utf8'))
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow(field_names)
        
        for obj in queryset:
            row = [getattr(obj, field) for field in field_names]
            writer.writerow(row)

        return response
    export_to_csv.short_description = "📊 Выгрузить выбранное в Excel (CSV)"