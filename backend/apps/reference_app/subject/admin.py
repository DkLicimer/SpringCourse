from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from import_export.admin import ImportExportModelAdmin

from apps.reference_app.subject.models import Subject

@admin.register(Subject)
class SubjectAdmin(ImportExportModelAdmin):
    icon_name = 'book'
    list_display = ['id', 'name']
    list_display_links = ['id', 'name']
    search_fields = ['name']

    save_as = False
    save_on_top = True

