from django.db import models

class Group(models.Model):

    name = models.CharField('Группа', max_length=255)


    class Meta():
        verbose_name = 'Группы'
        verbose_name_plural = 'Группа'
        db_table = 'group'

    def __str__(self):
        return self.name


