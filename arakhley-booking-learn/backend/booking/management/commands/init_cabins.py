from django.core.management.base import BaseCommand
from booking.models import Cabin

class Command(BaseCommand):
    help = 'Инициализация домиков ЗабГУ на озере Арахлей согласно комплектации'

    def handle(self, *args, **options):
        # Домики 14 и 15 временно заблокированы (is_active: False), но сохранены в базе
        cabins_data = [
            {"number": 1, "capacity": 4, "description": "Гостевой дом №1 (4 места, улучшенная комплектация, раздвижной диван)", "is_active": True},
            {"number": 2, "capacity": 3, "description": "Гостевой дом №2 (3 места)", "is_active": True},
            {"number": 7, "capacity": 4, "description": "Гостевой дом №7 (4 места)", "is_active": True},
            {"number": 8, "capacity": 4, "description": "Гостевой дом №8 (4 места)", "is_active": True},
            {"number": 9, "capacity": 4, "description": "Гостевой дом №9 (4 места)", "is_active": True},
            {"number": 10, "capacity": 4, "description": "Гостевой дом №10 (4 места)", "is_active": True},
            {"number": 11, "capacity": 4, "description": "Гостевой дом №11 (4 места)", "is_active": True},
            {"number": 12, "capacity": 3, "description": "Гостевой дом №12 (3 места)", "is_active": True},
            {"number": 13, "capacity": 4, "description": "Гостевой дом №13 (4 места)", "is_active": True},
            {"number": 14, "capacity": 4, "description": "Гостевой дом №14 (4 места, улучшенный комфорт, 2 двуспальные кровати)", "is_active": False},
            {"number": 15, "capacity": 4, "description": "Гостевой дом №15 (4 места, улучшенный комфорт, 2 двуспальные кровати)", "is_active": False},
        ]

        price_staff = 610.00   # рублей/сутки за весь дом
        price_student = 100.00 # рублей/сутки за койко-место

        self.stdout.write("Начало инициализации домиков ЗабГУ...")

        # Деактивируем домики, которых нет в текущем списке
        active_numbers = [c["number"] for c in cabins_data]
        Cabin.objects.exclude(number__in=active_numbers).update(is_active=False)

        for item in cabins_data:
            cabin, created = Cabin.objects.update_or_create(
                number=item["number"],
                defaults={
                    "capacity": item["capacity"],
                    "price_staff_full_cabin": price_staff,
                    "price_student_bed": price_student,
                    "description": item["description"],
                    "is_active": item["is_active"]
                }
            )
            status_str = "временно заблокирован" if not cabin.is_active else "активен"
            self.stdout.write(f"Домик №{cabin.number} успешно обновлен ({status_str}, мест: {cabin.capacity})")

        self.stdout.write(self.style.SUCCESS("Инициализация домиков ЗабГУ завершена!"))