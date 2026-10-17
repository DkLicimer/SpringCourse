from django.db import models
from django.utils import timezone

class Room(models.Model):
    """Помещение вуза (актовый зал, аудитория, коворкинг)"""
    name = models.CharField(max_length=255, verbose_name="Название помещения")
    address = models.CharField(max_length=255, verbose_name="Адрес / Корпус / Аудитория")
    capacity = models.CharField(
        max_length=255, 
        verbose_name="Вместимость и оснащение",
        help_text="Используйте символ | для разделения строк в карточке"
    )
    image = models.ImageField(upload_to="rooms/", verbose_name="Фотография помещения")
    is_active = models.BooleanField(default=True, verbose_name="Доступно для бронирования")

    class Meta:
        verbose_name = "Помещение"
        verbose_name_plural = "Помещения"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.address})"


class SpaceBooking(models.Model):
    """Заявка на бронирование аудитории по времени"""
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Ожидает одобрения'
        APPROVED = 'APPROVED', 'Одобрено'
        REJECTED = 'REJECTED', 'Отклонено'

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings', verbose_name="Помещение")
    event_name = models.CharField(max_length=255, verbose_name="Название мероприятия")
    start_time = models.DateTimeField(verbose_name="Время начала")
    end_time = models.DateTimeField(verbose_name="Время окончания")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name="Статус")
    
    sound_engineer_required = models.BooleanField(default=False, verbose_name="Требуется звукорежиссёр")
    
    applicant_full_name = models.CharField(max_length=255, verbose_name="ФИО заявителя")
    applicant_position = models.CharField(max_length=255, verbose_name="Должность / Подразделение")
    applicant_email = models.EmailField(verbose_name="Email заявителя")
    applicant_phone = models.CharField(max_length=50, verbose_name="Телефон заявителя")
    
    rejection_reason = models.TextField(blank=True, null=True, verbose_name="Причина отклонения/отмены")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата подачи заявки")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Дата изменения")

    class Meta:
        verbose_name = "Заявка на пространство"
        verbose_name_plural = "Заявки на пространства"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['room', 'start_time']),
            models.Index(fields=['status', 'start_time']),
        ]

    def __str__(self):
        return f"Заявка #{self.id} — {self.event_name} ({self.room.name})"