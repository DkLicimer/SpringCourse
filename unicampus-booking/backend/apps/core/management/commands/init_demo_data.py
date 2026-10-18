from django.core.management.base import BaseCommand
from apps.core.models import OrganizationSettings
from apps.spaces.models import Room
from apps.recreation.models import Cabin, CabinCategory

class Command(BaseCommand):
    help = "Инициализирует демонстрационные данные вуза"

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

        self.stdout.write("2. Создание аудиторий...")
        rooms_data = [
            {
                "name": "Актовый зал «Кулагин»",
                "address": "ул. Александро-Заводская, 30, 2 этаж",
                "capacity_seats": 250,
                "amenities": ["Экран 2240х1080", "Гримёрка на 15 чел", "Звуковой пульт 32ch"],
                "is_active": True,
            },
            {
                "name": "Единый офис молодежных организаций",
                "address": "ул. Бабушкина, 129, ауд. 236",
                "capacity_seats": 50,
                "amenities": ["Модульные столы", "Интерактивная доска", "Wi-Fi 6"],
                "is_active": True,
            },
            {
                "name": "Танцевальный зал",
                "address": "ул. Бабушкина, 129, 6 этаж",
                "capacity_seats": 50,
                "amenities": ["Зеркала в полный рост", "2 раздевалки", "Спортивные маты"],
                "is_active": True,
            },
        ]

        for r in rooms_data:
            Room.objects.update_or_create(name=r["name"], defaults=r)

        self.stdout.write("3. Создание домиков базы отдыха с координатами схемы...")
        cabins_data = [
            {"number": 1, "capacity": 4, "category": CabinCategory.COMFORT, "price_staff": 610.00, "price_student": 100.00, "map_x": 1330, "map_y": 960, "desc": "4 односпальные кровати, диван, кухонный гарнитур, холодильник, плита"},
            {"number": 2, "capacity": 3, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "map_x": 1280, "map_y": 1050, "desc": "3 односпальные кровати, холодильник, плита, умывальник"},
            {"number": 7, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "map_x": 543, "map_y": 697, "desc": "4 кровати, газовая плита, холодильник, постельное белье"},
            {"number": 8, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "map_x": 615, "map_y": 515, "desc": "4 кровати, обеденная зона, газовая плита, чайник"},
            {"number": 9, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "map_x": 493, "map_y": 515, "desc": "4 кровати, кухонная зона, холодильник"},
            {"number": 10, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "map_x": 543, "map_y": 430, "desc": "4 кровати, шифоньер, стол, холодильник"},
            {"number": 11, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "map_x": 615, "map_y": 369, "desc": "4 кровати, мебель, холодильник"},
            {"number": 12, "capacity": 3, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "map_x": 518, "map_y": 291, "desc": "3 кровати, кухонный стол, газовая плита"},
            {"number": 13, "capacity": 4, "category": CabinCategory.STANDARD, "price_staff": 610.00, "price_student": 100.00, "map_x": 430, "map_y": 369, "desc": "4 кровати, холодильник, плита"},
            {"number": 14, "capacity": 4, "category": CabinCategory.COMFORT, "price_staff": 610.00, "price_student": 100.00, "map_x": 615, "map_y": 266, "desc": "2 двуспальные кровати, микроволновка"},
            {"number": 15, "capacity": 4, "category": CabinCategory.COMFORT, "price_staff": 610.00, "price_student": 100.00, "map_x": 565, "map_y": 216, "desc": "2 двуспальные кровати, 2 холодильника, 2 чайника"},
            {
                "number": 16, "capacity": 4, "category": CabinCategory.VIP, "price_staff": 2500.00, "price_student": 0.00, "map_x": 1310, "map_y": 830,
                "desc": "Благоустроенный VIP-дом: бойлер, ТВ-плазма, микроволновка, сатиновое белье",
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
                    "map_x": c["map_x"],
                    "map_y": c["map_y"],
                    "description": c["desc"],
                    "is_active": True,
                }
            )

        self.stdout.write(self.style.SUCCESS("✓ Демонстрационные данные успешно загружены!"))