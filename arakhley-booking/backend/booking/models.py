import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone


class Cabin(models.Model):
    """Модель Домика. На базе всего 9 домиков."""
    number = models.PositiveSmallIntegerField(unique=True, verbose_name="Номер домика")
    capacity = models.PositiveSmallIntegerField(default=4, verbose_name="Вместимость (койко-мест)")
    
    # Раздельные тарифы для сотрудников (за домик целиком) и студентов (за койку)
    price_staff_full_cabin = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Цена за домик сутки (Сотрудник)"
    )
    price_student_bed = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name="Цена за койко-место/сутки (Студент)"
    )
    
    description = models.TextField(blank=True, null=True, verbose_name="Описание домика")
    is_active = models.BooleanField(default=True, verbose_name="Доступен для бронирования")

    class Meta:
        verbose_name = "Домик"
        verbose_name_plural = "Домики"
        ordering = ['number']

    def __str__(self):
        return f"Домик №{self.number}"


class Booking(models.Model):
    """Модель Бронирования"""
    
    class UserRole(models.TextChoices):
        STAFF = 'STAFF', 'Сотрудник'
        STUDENT = 'STUDENT', 'Студент'

    class Status(models.TextChoices):
        PENDING_PAYMENT = 'PENDING', 'Ожидает оплаты'
        RECEIPT_UPLOADED = 'RECEIPT_UPLOADED', 'Чек загружен'
        PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED', 'Оплата подтверждена'
        CONFIRMED = 'CONFIRMED', 'Бронирование подтверждено'
        CANCELLED = 'CANCELLED', 'Бронирование отменено'
        REJECTED = 'REJECTED', 'Оплата отклонена'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking_number = models.CharField(
        max_length=12, unique=True, verbose_name="Номер бронирования", db_index=True
    )
    
    # К какому домику привязана бронь
    cabin = models.ForeignKey(
        Cabin, on_delete=models.PROTECT, related_name='bookings', verbose_name="Домик"
    )
    
    user_role = models.CharField(
        max_length=10, choices=UserRole.choices, verbose_name="Роль пользователя"
    )
    
    # Сколько мест фактически заблокировано этой бронью в домике (от 1 до 4)
    # Для сотрудника это всегда 4 (весь домик), для студента — количество выбранных им койко-мест
    num_beds_booked = models.PositiveSmallIntegerField(verbose_name="Забронировано мест")
    
    # Даты проживания
    start_date = models.DateField(verbose_name="Дата заезда")
    end_date = models.DateField(verbose_name="Дата выезда")
    
    # Расчет стоимости
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Итоговая стоимость")
    
    # Контактные данные (плоская структура для MVP без регистрации)
    contact_name = models.CharField(max_length=255, verbose_name="ФИО контактного лица")
    contact_phone = models.CharField(max_length=20, verbose_name="Телефон")
    contact_email = models.EmailField(verbose_name="E-mail")
    
    # Поля для Сотрудника
    department = models.CharField(max_length=255, blank=True, null=True, verbose_name="Структурное подразделение")
    position = models.CharField(max_length=255, blank=True, null=True, verbose_name="Должность")
    
    # Поля для Студента
    faculty = models.CharField(max_length=255, blank=True, null=True, verbose_name="Факультет")
    academic_group = models.CharField(max_length=50, blank=True, null=True, verbose_name="Академическая группа")
    
    # Системные поля времени и статуса
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT, verbose_name="Статус"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    expires_at = models.DateTimeField(verbose_name="Время истечения брони")

    class Meta:
        verbose_name = "Бронирование"
        verbose_name_plural = "Бронирования"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Автоматическая генерация уникального номера бронирования, если его еще нет
        if not self.booking_number:
            # Например, формат: AR-260605-XXXX (Арахлей - Дата - случайный суффикс)
            date_str = timezone.now().strftime("%y%m%d")
            unique_suffix = str(uuid.uuid4().hex[:4]).upper()
            self.booking_number = f"AR-{date_str}-{unique_suffix}"
            
        # Автоматический расчет времени истечения брони (1 час на оплату)
        if not self.expires_at:
            # Если запись только создается, expires_at = время создания + 1 час
            # Примечание: на уровне БД created_at будет заполнено только после сохранения, 
            # поэтому берем текущее время.
            self.expires_at = timezone.now() + timedelta(hours=1)
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Бронь №{self.booking_number} ({self.get_status_display()})"


class Guest(models.Model):
    """Список отдыхающих внутри одной брони (для формирования путевки)"""
    
    class GuestCategory(models.TextChoices):
        ADULT = 'ADULT', 'Взрослый'
        CHILD_15 = 'CHILD_15', 'Ребенок до 15 лет'
        CHILD_3 = 'CHILD_3', 'Ребенок до 3 лет'

    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='guests', verbose_name="Бронирование"
    )
    full_name = models.CharField(max_length=255, verbose_name="ФИО гостя")
    category = models.CharField(
        max_length=10, choices=GuestCategory.choices, default=GuestCategory.ADULT, verbose_name="Категория"
    )

    class Meta:
        verbose_name = "Отдыхающий"
        verbose_name_plural = "Отдыхающие"

    def __str__(self):
        return f"{self.full_name} ({self.get_category_display()})"


def secure_receipt_upload_path(instance, filename):
    """
    Функция для генерации защищенного пути к файлу чека.
    Чеки не должны лежать в публичной папке media. Мы сохраняем их отдельно.
    В продакшене доступ к этой директории закрывается на уровне Nginx/Django.
    """
    ext = filename.split('.')[-1]
    # Сохраняем чеки под именем UUID бронирования для безопасности
    return f"receipts/{instance.booking.id}.{ext}"


class PaymentReceipt(models.Model):
    """Модель Чека / Подтверждения оплаты"""
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name='receipt', verbose_name="Бронирование"
    )
    # По ТЗ поддерживаются форматы: PDF, PNG, JPEG. Валидацию сделаем на уровне формы/сериализатора.
    file = models.FileField(upload_to=secure_receipt_upload_path, verbose_name="Файл чека")
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name="Загружен")
    user_comment = models.TextField(blank=True, null=True, verbose_name="Комментарий пользователя")
    admin_comment = models.TextField(blank=True, null=True, verbose_name="Причина отклонения (для админа)")

    class Meta:
        verbose_name = "Чек об оплате"
        verbose_name_plural = "Чеки об оплате"

    def __str__(self):
        return f"Чек для брони {self.booking.booking_number}"