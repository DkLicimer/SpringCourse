from django.db import models

class Subject(models.Model):

    name = models.CharField('Предмет', max_length=255)


    class Meta():
        verbose_name = 'Предметы'
        verbose_name_plural = 'Предмет'
        db_table = 'subject'

    def __str__(self):
        return self.name


