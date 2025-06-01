from django.db import models
from apps.reference_app.group.models import Group


class Student(models.Model):
    fio = models.CharField('ФИО', max_length=255, db_index=True)
    group = models.ForeignKey(Group, on_delete=models.PROTECT)
    telegram_id = models.CharField('Телеграм ID', max_length=255)

    class Meta():
        verbose_name = 'Студент'
        verbose_name_plural = 'Студенты'
        db_table = 'student'

    def __str__(self):
        return f'{self.fio} ({self.group.name})'

