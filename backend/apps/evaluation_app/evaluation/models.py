from django.db import models
from ckeditor.fields import RichTextField
from apps.user_app.crm_user.models import CrmUser


class Evaluation(models.Model):
    user = models.ForeignKey(CrmUser, on_delete=models.CASCADE)
    # schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE)
    use_methods = models.BooleanField('Использовались ли разнообразные методы подачи?', default=False)
    use_examples = models.BooleanField('Были ли примеры пояснения, способствующие лучшему усвоению?', default=False)
    is_consistently = models.BooleanField('Логично ли и последовательно проходило занятие?', default=False)
    is_interesting = models.BooleanField('Было ли интересно?', default=False)
    were_questions = models.BooleanField('Задавал ли ты вопросы?', default=False)
    losing_attention = models.BooleanField('Были ли моменты, когда внимание снижалось?', default=False)
    liked = models.BooleanField('Понравилось ли тебе занятие?', default=False)
    confused = models.BooleanField('Были ли моменты, когда вы чувствовали себя растерянным или запутанным?', default=False)
    stressed = models.BooleanField('Испытывали ли вы стресс во время занятия?', default=False)
    questions = models.TextField('Что было непонятно?', blank=True, null=True)
    recommendations = RichTextField('Рекомендации', blank=True, null=True)

    class Meta():
        verbose_name = 'Оценка занятия'
        verbose_name_plural = 'Оценки занятий'
        db_table = 'evaluation'

    def __str__(self):
        return f'{self.id}'

