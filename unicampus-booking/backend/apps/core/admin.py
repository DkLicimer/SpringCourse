from django.contrib import admin
from .models import OrganizationSettings

@admin.register(OrganizationSettings)
class OrganizationSettingsAdmin(admin.ModelAdmin):
    fieldsets = (
        ("Локализация и регион", {
            "fields": ("timezone",)
        }),
        ("Брендинг и наименования", {
            "fields": (
                "university_name", "university_short_name", "logo", 
                "primary_color", "accent_color"
            )
        }),
        ("Контакты организации", {
            "fields": ("contact_phone", "contact_email", "address")
        }),
        ("Банковские реквизиты (для оплаты)", {
            "fields": (
                "recipient_name", "inn", "kpp", "oktmo", "bank_name",
                "bik", "bank_account", "recipient_account", "kbk", "payment_purpose"
            )
        }),
    )

    def has_add_permission(self, request):
        return not OrganizationSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False