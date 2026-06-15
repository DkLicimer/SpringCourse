import csv
from django.contrib import admin
from django.http import HttpResponse
from django.utils import timezone
from .models import Cabin, Booking, Guest, PaymentReceipt
from .utils import send_booking_notification


class GuestInline(admin.TabularInline):
    model = Guest
    extra = 0


class PaymentReceiptInline(admin.StackedInline):
    model = PaymentReceipt
    extra = 0
    readonly_fields = ['uploaded_at']


@admin.register(Cabin)
class CabinAdmin(admin.ModelAdmin):
    list_display = ['number', 'capacity', 'price_staff_full_cabin', 'price_student_bed', 'is_active']
    list_editable = ['price_staff_full_cabin', 'price_student_bed', 'is_active']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'booking_number', 'contact_name', 'user_role', 'cabin', 
        'start_date', 'end_date', 'total_price', 'status', 'created_at'
    ]
    list_filter = ['status', 'user_role', 'start_date', 'cabin']
    search_fields = ['booking_number', 'contact_name', 'contact_email', 'contact_phone']
    readonly_fields = ['booking_number', 'created_at', 'expires_at', 'total_price']
    inlines = [GuestInline, PaymentReceiptInline]
    
    # Кастомные действия (Actions) администратора
    actions = ['confirm_payment_action', 'reject_payment_action', 'export_to_csv']

    def confirm_payment_action(self, request, queryset):
        """Экшн подтверждения оплаты"""
        count = 0
        for booking in queryset:
            if booking.status in [Booking.Status.PENDING_PAYMENT, Booking.Status.RECEIPT_UPLOADED]:
                booking.status = Booking.Status.CONFIRMED
                booking.save()
                
                # Автоматически генерируем путевку и отправляем пользователю
                send_booking_notification(booking, "CONFIRMED")
                count += 1
                
        self.message_user(request, f"Успешно подтверждено бронирований: {count}. Путевки высланы на email.")
    
    confirm_payment_action.short_description = "🟢 Подтвердить оплату и отправить путевку"

    def reject_payment_action(self, request, queryset):
        """Экшн отклонения оплаты"""
        count = 0
        for booking in queryset:
            if booking.status in [Booking.Status.PENDING_PAYMENT, Booking.Status.RECEIPT_UPLOADED]:
                booking.status = Booking.Status.REJECTED
                booking.save()
                count += 1
        self.message_user(request, f"Отклонено бронирований: {count}.")
        
    reject_payment_action.short_description = "🔴 Отклонить оплату"

    def export_to_csv(self, request, queryset):
        """Экспорт списка бронирований в Excel (CSV)"""
        meta = self.model._meta
        field_names = [field.name for field in meta.fields]

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename=bookings_export_{timezone.now().strftime("%Y%m%d")}.csv'
        
        # Добавляем BOM для корректного отображения кириллицы в Excel
        response.write(u'\ufeff'.encode('utf8'))
        
        writer = csv.writer(response, delimiter=';')
        writer.writerow(field_names)
        
        for obj in queryset:
            row = [getattr(obj, field) for field in field_names]
            writer.writerow(row)

        return response

    export_to_csv.short_description = "📊 Выгрузить выбранное в Excel (CSV)"