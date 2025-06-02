from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.user_app.crm_user.models import CrmUser


class CrmUserAdmin(UserAdmin):
    icon_name = 'person'
    model = CrmUser
    list_display = (
    "username", "first_name", "last_name", "is_active", 'is_superuser', 'is_teacher')
    list_display_links = ("username", "first_name", "last_name", 'is_teacher')
    list_filter = ("is_active", "groups", 'is_teacher')
    search_fields = ("username", "first_name", "last_name", "email")
    fieldsets = (
        (None, {'fields': ['username', 'email', 'password', 'first_name', 'last_name', 'is_active',
                           'is_superuser', 'is_teacher']}),
    )

    add_fieldsets = (
        (None, {
            'fields': ['username', 'email', 'password1', 'password2', 'first_name', 'last_name', 'is_active',
                    'is_teacher']}),
    )

    save_as = False
    save_on_top = True


admin.site.register(CrmUser, CrmUserAdmin)
