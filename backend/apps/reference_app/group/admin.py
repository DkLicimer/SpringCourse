from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from import_export.admin import ImportExportModelAdmin

from apps.reference_app.group.models import Group

@admin.register(Group)
class GroupAdmin(ImportExportModelAdmin):
    icon_name = 'group'
    list_display = ['id', 'name']
    list_display_links = ['id', 'name']
    search_fields = ['name']

    save_as = False
    save_on_top = True

