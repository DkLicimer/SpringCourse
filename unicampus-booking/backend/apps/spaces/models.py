import re
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateTimeRangeField, RangeOperators
from django.utils import timezone


def validate_phone(value):
    digits = re.sub(r'\D', '', value)
    if not (len(digits) == 11 and digits.startswith(('7', '8'))):
        raise ValidationError('Укажите корректный номер телефона РФ (+7 (9XX) XXX-XX-XX).')


class Room(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название помещения")
    address = models.CharField(max_length=255, verbose_name="Корпус / Адрес")
    capacity_seats = models.PositiveIntegerField(default=30, verbose_name="Вместимость (посадочных мест)")
    amenities = models.JSONField(default=list, blank=True, verbose_name="Оснащение и оборудование")
    image = models.ImageField(upload_to="rooms/", verbose_name="Фотография помещения", blank=True, null=True)
    is_active = models.BooleanField(default=True, verbose_name="Доступно")

    class Meta:
        verbose_name = "Помещение"
        verbose_name_plural = "Помещения"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.address})"


class SpaceBooking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Ожидает одобрения'
        APPROVED = 'APPROVED', 'Одобрено'
        REJECTED = 'REJECTED', 'Отклонено'

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings', verbose_name="Помещение")
    event_name = models.CharField(max_length=255, verbose_name="Название мероприятия")
    start_time = models.DateTimeField(verbose_name="Время начала")
    end_time = models.DateTimeField(verbose_name="Время окончания")
    time_range = DateTimeRangeField(editable=False, null=True, verbose_name="Диапазон времени")
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name="Статус")
    sound_engineer_required = models.BooleanField(default=False, verbose_name="Требуется звукорежиссёр")
    
    applicant_full_name = models.CharField(max_length=255, verbose_name="ФИО заявителя")
    applicant_position = models.CharField(max_length=255, verbose_name="Должность / Группа")
    applicant_email = models.EmailField(verbose_name="Email заявителя")
    applicant_phone = models.CharField(max_length=50, validators=[validate_phone], verbose_name="Телефон заявителя")
    
    rejection_reason = models.TextField(blank=True, null=True, verbose_name="Причина отклонения")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Заявка на пространство"
        verbose_name_plural = "Заявки на пространства"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['room', 'start_time']),
            models.Index(fields=['status', 'start_time']),
            models.Index(fields=['applicant_email']),
        ]

    def save(self, *args, **kwargs):
        from psycopg2.extras import DateTimeTZRange
        self.time_range = DateTimeTZRange(self.start_time, self.end_time, '[)')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"#{self.id}: {self.event_name} ({self.room.name})"