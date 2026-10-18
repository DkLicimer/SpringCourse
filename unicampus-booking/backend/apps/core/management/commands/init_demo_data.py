from django.core.management.base import BaseCommand
from apps.core.models import OrganizationSettings
from apps.spaces.models import Room
from apps.recreation.models import Cabin, CabinCategory

class Command(BaseCommand):
    help = "Инициализирует демонстрационные данные вуза (настройки, аудитории, домики)"

    def handle(self, *args, **options):
        self.stdout.write("1. Создание настроек вуза и брендинга...")
        OrganizationSettings.objects.get_or_create(
            pk=1,
            defaults={
                "university_name": "Забайкальский Государственный Университет",
                "university_short_name": "ЗабГУ",
                "primary_color": "#1E3A8A",
                "accent_color": "#10B981",
                "contact_phone": "8 (914) 491-20-84",
                "contact_email": "projectsddm@zabgu.ru",
                "address": "г. Чита, ул. Александро-Заводская, д. 30",
                "payment_purpose": "Арахлей",
            }
        )

        self.stdout.write("2. Создание аудиторий и пространств...")
        rooms_data = [
            {
                "name": "Актовый зал «Кулагин»",
                "address": "ул. Александро-Заводская, 30, 2 этаж",
                "capacity": "До 250 человек|Экран 2240х1080|Гримёрка 15 человек",
                "is_active": True,
            },
            {
                "name": "Единый офис молодежных организаций",
                "address": "ул. Бабушкина, 129, ауд. 236",
                "capacity": "До 50 человек|Модульные столы|Интерактивная доска",
                "is_active": True,
            },
            {
                "name": "Танцевальный зал",
                "address": "ул. Бабушкина, 129, 6 этаж",
                "capacity": "До 50 человек|Зеркала в полный рост|2 раздевалки|Спортивные маты",
                "is_active": True,
            },
        ]

        for r in rooms_data:
            Room.objects.get_or_create(name=r["name"], defaults=r)

        self.stdout.write("3. Создание домиков базы отдыха...")
        cabins_data = [
            {"number": 1, "capacity": 4, "category": CabinCategory.COMFORT, "price_staff": 610.00, "price_student": 100.00, "desc": "4 односпальные кровати, диван, кухонный гарнитур, холодильник, плита"},
            {"number": 2, "capacity": 3, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "desc": "3 односпальные кровати, холодильник, плита, умывальник"},
            {"number": 7, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "desc": "4 кровати, газовая плита, холодильник, комплект постельного белья"},
            {"number": 8, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "desc": "4 кровати, обеденная зона, газовая плита, чайник"},
            {"number": 9, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "desc": "4 кровати, кухонная зона, холодильник"},
            {"number": 10, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "desc": "4 кровати, шифоньер, стол, холодильник"},
            {"number": 11, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "desc": "4 кровати, мебель, холодильник"},
            {"number": 12, "capacity": 3, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "desc": "3 кровати, кухонный стол, газовая плита"},
            {"number": 13, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "desc": "4 кровати, холодильник, плита"},
            {"number": 14, "capacity": 4, "category": CabinCategory.COMFORT, "price_staff": 610.00, "price_student": 100.00, "desc": "2 двуспальные кровати, повышенный комфорт, микроволновка"},
            {"number": 15, "capacity": 4, "category": CabinCategory.COMFORT, "price_staff": 610.00, "price_student": 100.00, "desc": "2 двуспальные кровати, тумбочки, 2 холодильника, 2 чайника"},
            {
                "number": 16,
                "capacity": 4,
                "category": CabinCategory.VIP,
                "price_staff": 2500.00,
                "price_student": 0.00,  # 0 означает закрыто для студентов
                "desc": "Благоустроенный VIP-дом: горячая/холодная вода (бойлер), ТВ-плазма, микроволновка, сатиновое белье",
            },
        ]

        for c in cabins_data:
            Cabin.objects.update_or_create(
                number=c["number"],
                defaults={
                    "capacity": c["capacity"],
                    "category": c["category"],
                    "price_staff_full_cabin": c["price_staff"],
                    "price_student_bed": c["price_student"],
                    "description": c["desc"],
                    "is_active": True,
                }
            )

        self.stdout.write(self.style.SUCCESS("✓ Демонстрационные данные успешно загружены!"))