import os
import sys
import datetime

# Добавляем корневую папку в пути, чтобы скрипт мог импортировать утилиты
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Настройка окружения Django для корректного импорта моделей (если требуется)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from booking.utils import generate_voucher_pdf

# Создаем легковесные заглушки объектов (Mock), имитирующие реальные данные из БД Django
class MockGuest:
    def __init__(self, full_name, category_display):
        self.full_name = full_name
        self.category_display = category_display
        
    def get_category_display(self):
        return self.category_display


class MockGuestManager:
    def __init__(self, guests_list):
        self.guests_list = guests_list
        
    def all(self):
        return self
        
    def exists(self):
        return len(self.guests_list) > 0
        
    def count(self):
        return len(self.guests_list)
        
    def __iter__(self):
        return iter(self.guests_list)


class MockBooking:
    def __init__(self, role="STUDENT"):
        self.booking_number = "AR-260615-A1B2"
        self.contact_name = "Иванов Иван Иванович"
        self.user_role = role
        self.contact_phone = "+7 (999) 111-22-33"
        self.contact_email = "ivanov@zabgu.ru"
        
        if role == "STUDENT":
            self.faculty = "ФИТИС"
            self.academic_group = "ИПВ-22"
            self.position = None
            self.department = None
            self.total_price = 400.00
        else:
            self.faculty = None
            self.academic_group = None
            self.position = "Старший преподаватель"
            self.department = "Кафедра ИТ"
            self.total_price = 2440.00
            
        self.start_date = datetime.date(2026, 6, 15)
        self.end_date = datetime.date(2026, 6, 19)
        self.guests = MockGuestManager([
            MockGuest("Иванов Иван Иванович", "Взрослый"),
            MockGuest("Иванова Мария Петровна", "Взрослый"),
            MockGuest("Иванов Сергей Иванович", "Ребенок до 15 лет"),
        ])


def run_test():
    print("Генерация тестовой путевки...")
    
    # Создаем тестовую бронь (можете заменить на "STAFF" для проверки карточки сотрудника)
    test_booking = MockBooking(role="STAFF")
    
    try:
        pdf_data = generate_voucher_pdf(test_booking)
        
        output_filename = "voucher_test.pdf"
        with open(output_filename, "wb") as f:
            f.write(pdf_data)
            
        print(f"\n[УСПЕХ] Тестовый PDF-файл успешно сохранен как: {os.path.abspath(output_filename)}")
        print("Вы можете открыть его для проверки верстки и подписи.")
    except Exception as e:
        print(f"\n[ОШИБКА] Не удалось сгенерировать путевку: {e}")


if __name__ == "__main__":
    run_test()