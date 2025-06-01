import copy
import hashlib
import time
from datetime import datetime, timedelta

import requests
from django.core.management import BaseCommand

from apps.tinkoff.models import Payment
from core import settings


class Command(BaseCommand):
    def generate_token(self, params):
        # Сортируем параметры по ключу
        sorted_params = sorted(params.items())
        # Формируем строку из значений параметров
        token_string = "".join(str(value) for _, value in sorted_params)
        # Генерируем SHA256 токен
        return hashlib.sha256(token_string.encode("utf-8")).hexdigest()

    def handle(self, *args, **options):
        """
        обновить данные в платежах
        """

        date = datetime.now()

        # Фильтруем платежи за последние 20 минут
        payments = Payment.objects.filter(
            date__gte=date - timedelta(minutes=20),
            date__lte=date
        )

        for payment in payments:
            if payment.status != 'CONFIRMED':
                payment_id = payment.payment_id
                url = settings.TINKOFF_API_URL + "GetState"
                params = {
                    "TerminalKey": settings.TINKOFF_TERMINAL_KEY,
                    "Password": settings.TINKOFF_PASSWORD,
                    "PaymentId": payment_id,
                }
                token = self.generate_token(params)
                params['Token'] = token

                response = requests.post(url, json=params)

                payment.status = response.json().get('Status', '')
                payment.save()
