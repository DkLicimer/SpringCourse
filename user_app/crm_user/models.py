from django.contrib.auth.models import AbstractUser
from django.db import models

class CrmUser(AbstractUser):

    is_teacher = models.BooleanField('Роль преподавателя', default=False)


    class Meta():
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователь'
        db_table = 'crm_user'

    def __str__(self):
        return self.username


