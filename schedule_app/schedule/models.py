from django.db import models
from apps.reference_app.group.models import Group
from apps.reference_app.subject.models import Subject
from apps.reference_app.time.models import Time
from apps.user_app.crm_user.models import CrmUser


class Schedule(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(CrmUser, limit_choices_to={'is_teacher': True}, on_delete=models.PROTECT)
    time = models.ForeignKey(Time, on_delete=models.PROTECT)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)

    class Meta():
        verbose_name = 'Расписание'
        verbose_name_plural = 'Расписание'
        db_table = 'schedule'

    def __str__(self):
        return f'{self.id}'