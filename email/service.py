from django.template.loader import render_to_string
from django.core.mail import EmailMessage

from core import settings
from core.local_settings import BASE_URL


class EmailBoot:
    @staticmethod
    def get_email_info():
        login = BASE_URL + '/login'
        email_info = {
            'login': login,
        }
        return email_info

    @staticmethod
    def _send(zagolovok, telo_pisma, komu):
        try:
            msg = EmailMessage(zagolovok, telo_pisma, settings.EMAIL_HOST_USER, komu)
            msg.content_subtype = "html"
            msg.send()
        except Exception as e:
            pass

    @staticmethod
    def klientu_soverchen_zakaz(zakaz_list, email):

        telo_pisma = render_to_string(context={'zakaz_list': zakaz_list, 'email_info': EmailBoot.get_email_info(), },
                                      template_name='email/shablon_zakaza.html')

        EmailBoot._send('Ваш заказ успешно оформлен - Коваль Лайт', telo_pisma, email)

    @staticmethod
    def pismo_osnovnoy_shablon(title, subtitle, email):

        telo_pisma = render_to_string(context={'title': title, 'subtitle': subtitle, 'email_info': EmailBoot.get_email_info(),},
                                      template_name='email/shablon_osnova.html')

        EmailBoot._send(f'{title} - Коваль Лайт', telo_pisma, [email])
