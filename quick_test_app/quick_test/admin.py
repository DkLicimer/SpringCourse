from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from apps.evaluation_app.evaluation.models import Evaluation
from apps.quick_test_app.quick_test.models import QuickTest


@admin.register(QuickTest)
class QuickTestAdmin(ImportExportModelAdmin):
    icon_name = 'assignment'
    list_display = [
        "id",
    ]
    list_display_links = [
        "id",
    ]
    search_fields = []

    save_on_top = True
    save_as = True


