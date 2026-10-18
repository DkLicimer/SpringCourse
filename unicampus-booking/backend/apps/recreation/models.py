import uuid
import re
from datetime import timedelta
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone


def validate_phone(value):
    digits = re.sub(r'\D', '', value)
    if not (len(digits) == 11 and digits.startswith(('7', '8'))):
        raise ValidationError('Укажите корректный номер телефона РФ (+7 (9XX) XXX-XX-XX).')


class CabinCategory(models.TextChoices):
    STANDARD = 'STANDARD', 'Стандарт'
    COMFORT = 'COMFORT', 'Повышенный комфорт'
    VIP = 'VIP', 'Благоустроенный VIP'


class Cabin(models.Model):
    number = models.PositiveSmallIntegerField(unique=True, verbose_name="Номер домика")
    title = models.CharField(max_length=100, blank=True, verbose_name="Метка на схеме")
    category = models.CharField(max_length=20, choices=CabinCategory.choices, default=CabinCategory.STANDARD)
    capacity = models.PositiveSmallIntegerField(default=4, verbose_name="Вместимость (койко-мест)")
    
    price_staff_full_cabin = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена/сут (Сотрудник)")
    price_student_bed = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Цена койки/сут (Студент)")
    
    # Динамические координаты на интерактивной векторной карте
    map_x = models.FloatField(default=0.0, verbose_name="Координата X на карте (px)")
    map_y = models.FloatField(default=0.0, verbose_name="Координата Y на карте (px)")
    
    description = models.TextField(blank=True, verbose_name="Описание и комплектация")
    is_active = models.BooleanField(default=True, verbose_name="Доступен")

    class Meta:
        verbose_name = "Домик базы отдыха"
        verbose_name_plural = "Домики базы отдыха"
        ordering = ['number']

    def __str__(self):
        return f"Домик №{self.number} ({self.get_category_display()})"


class RecreationBooking(models.Model):
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
    booking_number = models.CharField(max_length=24, unique=True, db_index=True)
    
    cabin = models.ForeignKey(Cabin, on_delete=models.PROTECT, related_name='primary_bookings')
    second_cabin = models.ForeignKey(Cabin, on_delete=models.PROTECT, null=True, blank=True, related_name='secondary_bookings')
    
    user_role = models.CharField(max_length=10, choices=UserRole.choices)
    num_beds_booked = models.PositiveSmallIntegerField(default=1)
    
    start_date = models.DateField(verbose_name="Дата заезда")
    end_date = models.DateField(verbose_name="Дата выезда")
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    contact_name = models.CharField(max_length=255)
    contact_phone = models.CharField(max_length=30, validators=[validate_phone])
    contact_email = models.EmailField(db_index=True)
    
    department = models.CharField(max_length=255, blank=True, null=True)
    position = models.CharField(max_length=255, blank=True, null=True)
    faculty = models.CharField(max_length=255, blank=True, null=True)
    academic_group = models.CharField(max_length=50, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = "Бронирование базы"
        verbose_name_plural = "Бронирования базы"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.booking_number:
            date_part = timezone.now().strftime("%y%m%d")
            self.booking_number = f"UB-{date_part}-{uuid.uuid4().hex[:4].upper()}"
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=1)
        super().save(*args, **kwargs)


class Guest(models.Model):
    class Category(models.TextChoices):
        ADULT = 'ADULT', 'Взрослый'
        CHILD_FREE = 'CHILD_FREE', 'Ребенок до 10 лет (бесплатно)'
        INFANT = 'INFANT', 'Ребенок до 3 лет (без места)'
        CHILD_TEEN = 'CHILD_TEEN', 'Ребенок 10-17 лет'

    booking = models.ForeignKey(RecreationBooking, on_delete=models.CASCADE, related_name='guests')
    full_name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.ADULT)
    document_info = models.CharField(max_length=100, blank=True)
    birth_date = models.DateField(null=True, blank=True)


class PaymentReceipt(models.Model):
    booking = models.OneToOneField(RecreationBooking, on_delete=models.CASCADE, related_name='receipt')
    file = models.FileField(upload_to="receipts/%Y/%m/")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    user_comment = models.TextField(blank=True)
    admin_comment = models.TextField(blank=True)