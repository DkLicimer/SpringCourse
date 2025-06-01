from django.contrib import admin
from django.template.defaultfilters import safe
from import_export.admin import ImportExportModelAdmin

from apps.bludo_app.bludo.models import Bludo
from apps.bludo_app.sostav_bluda.admin import SostavBludaInline


@admin.register(Bludo)
class BludoAdmin(ImportExportModelAdmin):
    icon_name = 'room_service'
    inlines = [SostavBludaInline]
    list_display = [
        "id",
        "nazvanie",
        "kategoria_bluda",
        "kaloriinost",
        "is_postnoe_bludo",
        "is_archive",
        "photo_admin",
    ]
    list_display_links = [
        "id",
        "nazvanie",
    ]
    search_fields = ['nazvanie', ]

    save_on_top = True
    save_as = True

    def photo_admin(self, instance):
        if instance.photo:
            return safe(
                f'<a target="_black" href="{instance.photo.url}"><img width=70 height=70 src="{instance.photo.url}"></a>')
        return 'Нет'

    photo_admin.short_description = 'Фото'

