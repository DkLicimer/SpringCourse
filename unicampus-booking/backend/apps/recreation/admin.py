from django.contrib import admin
from django.utils.html import format_html
from .models import Cabin, RecreationBooking, Guest, PaymentReceipt
from .pdf import generate_voucher_pdf
from apps.notifications.services import NotificationService

class GuestInline(admin.TabularInline):
    model = Guest
    extra = 0

class PaymentReceiptInline(admin.StackedInline):
    model = PaymentReceipt
    extra = 0
    readonly_fields = ['uploaded_at', 'receipt_preview']

    def receipt_preview(self, obj):
        if obj.file:
            return format_html('<a href="{}" target="_blank">📄 Открыть прикреплённый чек</a>', obj.file.url)
        return "Чек не прикреплен"

@admin.register(Cabin)
class CabinAdmin(admin.ModelAdmin):
    list_display = ['number', 'title', 'category', 'capacity', 'price_staff_full_cabin', 'price_student_bed', 'is_active']
    list_editable = ['price_staff_full_cabin', 'price_student_bed', 'is_active']
    list_filter = ['category', 'is_active']

@admin.register(RecreationBooking)
class RecreationBookingAdmin(admin.ModelAdmin):
    list_display = ['booking_number', 'contact_name', 'user_role', 'start_date', 'end_date', 'total_price', 'status']
    list_filter = ['status', 'user_role', 'start_date']
    search_fields = ['booking_number', 'contact_name', 'contact_email', 'contact_phone']
    inlines = [GuestInline, PaymentReceiptInline]
    actions = ['approve_and_send_voucher', 'reject_payment']

    def approve_and_send_voucher(self, request, queryset):
        for b in queryset:
            b.status = RecreationBooking.Status.CONFIRMED
            b.save()
            pdf_bytes = generate_voucher_pdf(b)
            NotificationService.send_email(
                subject=f"Путёвка на базу отдыха № {b.booking_number}",
                body=f"Здравствуйте, {b.contact_name}!\n\nОплата подтверждена. Ваша путевка прикреплена к письму.",
                to_email=b.contact_email,
                attachments=[(f"Voucher_{b.booking_number}.pdf", pdf_bytes, "application/pdf")]
            )
        self.message_user(request, "Бронирования подтверждены, путевки сгенерированы и высланы!")
    approve_and_send_voucher.short_description = "🟢 Подтвердить оплату и выслать PDF-путёвку"

    def reject_payment(self, request, queryset):
        for b in queryset:
            b.status = RecreationBooking.Status.REJECTED
            b.save()
            NotificationService.send_email(
                subject=f"Оплата бронирования {b.booking_number} отклонена",
                body=f"Здравствуйте, {b.contact_name}!\n\nК сожалению, оплата не была подтверждена бухгалтерией.",
                to_email=b.contact_email
            )
        self.message_user(request, "Бронирования отклонены.")
    reject_payment.short_description = "🔴 Отклонить оплату"