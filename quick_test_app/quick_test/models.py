from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone

from apps.user_app.crm_user.models import CrmUser
from apps.schedule_app.schedule.models import Schedule


class QuickTest(models.Model):
    crm_user = models.ForeignKey(CrmUser, on_delete=models.СASCADE)
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE)
    rating = models.IntegerField('Оценка от 1 - 5', default=5)
    time_stamp = models.DateTimeField('Дата', default=timezone.now)
    time_since_start = models.IntegerField('Время от начала занятия', validators=[MinValueValidator(1), MaxValueValidator(90)])


    class Meta():
        verbose_name = 'Быстрые тесты'
        verbose_name_plural = 'Быстрые тесты'
        db_table = 'quick_test'

    def __str__(self):
        return f'{self.id}'