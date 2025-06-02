from django.db import models

class Time(models.Model):

    name = models.CharField('Пара', max_length=255)
    time_start = models.TimeField('Время начала пары')
    time_end = models.TimeField('Время окончания пары')


    class Meta():
        verbose_name = 'Расписание звонков'
        verbose_name_plural = 'Расписание звонков'
        db_table = 'time'

    def __str__(self):
        return self.name


