import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone

class CabinCategory(models.TextChoices):
    STANDARD = 'STANDARD', 'Стандарт'
    COMFORT = 'COMFORT', 'Повышенный комфорт'
    VIP = 'VIP', 'Благоустроенный VIP'

class Cabin(models.Model):
    """Гостевой дом / Корпус базы отдыха"""
    number = models.PositiveSmallIntegerField(unique=True, verbose_name="Номер объекта/домика")
    title = models.CharField(max_length=100, blank=True, verbose_name="Название/метка")
    category = models.CharField(max_length=20, choices=CabinCategory.choices, default=CabinCategory.STANDARD, verbose_name="Категория")
    capacity = models.PositiveSmallIntegerField(default=4, verbose_name="Вместимость (койко-мест)")
    
    price_staff_full_cabin = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена/сутки (Сотрудник)")
    price_student_bed = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Цена койки/сутки (Студент, 0=закрыто)")
    
    description = models.TextField(blank=True, verbose_name="Описание и комплектация")
    is_active = models.BooleanField(default=True, verbose_name="Доступен для бронирования")

    class Meta:
        verbose_name = "Домик / Объект базы"
        verbose_name_plural = "Домики / Объекты базы"
        ordering = ['number']

    def __str__(self):
        return f"Домик №{self.number} ({self.get_category_display()})"


class RecreationBooking(models.Model):
    """Бронирование базы отдыха"""
    class UserRole(models.TextChoices):
        STAFF = 'STAFF', 'Сотрудник'
        STUDENT = 'STUDENT', 'Студент'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Ожидает оплаты'
        RECEIPT_UPLOADED = 'RECEIPT_UPLOADED', 'Чек прикреплен'
        CONFIRMED = 'CONFIRMED', 'Бронь подтверждена'
        CANCELLED = 'CANCELLED', 'Отменено'
        REJECTED = 'REJECTED', 'Оплата отклонена'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_number = models.CharField(max_length=24, unique=True, db_index=True, verbose_name="Номер брони")
    
    cabin = models.ForeignKey(Cabin, on_delete=models.PROTECT, related_name='primary_bookings', verbose_name="Основной домик")
    second_cabin = models.ForeignKey(Cabin, on_delete=models.PROTECT, null=True, blank=True, related_name='secondary_bookings', verbose_name="Второй домик")
    
    user_role = models.CharField(max_length=10, choices=UserRole.choices, verbose_name="Категория отдыхающего")
    num_beds_booked = models.PositiveSmallIntegerField(default=1, verbose_name="Забронировано мест")
    
    start_date = models.DateField(verbose_name="Дата заезда")
    end_date = models.DateField(verbose_name="Дата выезда")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Итоговая сумма")
    
    contact_name = models.CharField(max_length=255, verbose_name="ФИО контактного лица")
    contact_phone = models.CharField(max_length=30, verbose_name="Телефон")
    contact_email = models.EmailField(verbose_name="E-mail")
    
    department = models.CharField(max_length=255, blank=True, null=True, verbose_name="Подразделение (Сотрудник)")
    position = models.CharField(max_length=255, blank=True, null=True, verbose_name="Должность (Сотрудник)")
    faculty = models.CharField(max_length=255, blank=True, null=True, verbose_name="Факультет (Студент)")
    academic_group = models.CharField(max_length=50, blank=True, null=True, verbose_name="Группа (Студент)")
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name="Статус")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    expires_at = models.DateTimeField(verbose_name="Оплатить до")

    class Meta:
        verbose_name = "Бронирование базы отдыха"
        verbose_name_plural = "Бронирования базы отдыха"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.booking_number:
            date_part = timezone.now().strftime("%y%m%d")
            suffix = str(uuid.uuid4().hex[:4]).upper()
            self.booking_number = f"UB-{date_part}-{suffix}"
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_number} ({self.contact_name})"


class Guest(models.Model):
    """Отдыхающие по путевке"""
    class Category(models.TextChoices):
        ADULT = 'ADULT', 'Взрослый'
        CHILD_FREE = 'CHILD_FREE', 'Ребенок до 10 лет (бесплатно)'
        INFANT = 'INFANT', 'Ребенок до 3 лет (без места)'
        CHILD_TEEN = 'CHILD_TEEN', 'Ребенок 10-17 лет'

    booking = models.ForeignKey(RecreationBooking, on_delete=models.CASCADE, related_name='guests')
    full_name = models.CharField(max_length=255, verbose_name="ФИО")
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.ADULT)
    document_info = models.CharField(max_length=100, blank=True, verbose_name="Паспорт / Свидетельство")
    birth_date = models.DateField(null=True, blank=True, verbose_name="Дата рождения")


class PaymentReceipt(models.Model):
    """Скан или скриншот банковского чека"""
    booking = models.OneToOneField(RecreationBooking, on_delete=models.CASCADE, related_name='receipt')
    file = models.FileField(upload_to="receipts/%Y/%m/", verbose_name="Файл чека")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    user_comment = models.TextField(blank=True, verbose_name="Комментарий плательщика")
    admin_comment = models.TextField(blank=True, verbose_name="Причина отказа")