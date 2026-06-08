from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Администратор"),
        ("user", "Пользователь"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="user")

    @property
    def is_admin(self):
        return self.role == "admin" or self.is_superuser


class Computer(models.Model):
    STATUS_CHOICES = (
        ("available", "Доступен"),
        ("maintenance", "На обслуживании"),
    )
    name = models.CharField("Название", max_length=100)
    specs = models.TextField("Характеристики", blank=True)
    price_per_hour = models.DecimalField("Цена за час", max_digits=8, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")

    def __str__(self):
        return self.name


class Booking(models.Model):
    STATUS_CHOICES = (
        ("active", "Активно"),
        ("finished", "Завершено"),
        ("cancelled", "Отменено"),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookings")
    computer = models.ForeignKey(Computer, on_delete=models.CASCADE, related_name="bookings")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]