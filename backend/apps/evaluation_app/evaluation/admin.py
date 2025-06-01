from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from apps.evaluation_app.evaluation.models import Evaluation


@admin.register(Evaluation)
class EvaluationAdmin(ImportExportModelAdmin):
    icon_name = 'mark'
    list_display = [
        "id",
    ]
    list_display_links = [
        "id",
    ]
    search_fields = []

    save_on_top = True
    save_as = True


