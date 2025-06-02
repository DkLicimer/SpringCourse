from django.contrib.auth import login
from django.middleware import csrf
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.email.service import EmailBoot
from apps.user_app.crm_user.models import CrmUser
from apps.user_app.crm_user.serializers import RegistraziaSerializer


class RegistraziaApi(APIView):
    def post(self, request,):
        serializer = RegistraziaSerializer(data=request.data)
        if serializer.is_valid():

            if CrmUser.objects.filter(email=request.data['email']).count() != 0:
                return Response({'text': 'Вы уже ранее регистрировались. Пожалуйста авторезируйтесь иил сбросьте пароль'},
                                status=400)

            user = CrmUser.objects.create_user(request.data['email'], request.data['email'], request.data['pas'])

            user.nazvanie = request.data['fio']
            user.phone = request.data['phone']
            user.save()

            title = 'Добро пожаловать!'
            subtitle = 'Благодарим Вас за регистрацию на нашем сайте! Теперь Вы можете совершать заказы через свой личный кабинет'
            EmailBoot.pismo_osnovnoy_shablon(title, subtitle, request.data['email'])

            login(request, user)
            return Response({'csrftoken': csrf.get_token(request), 'sessionid': request.session.session_key},
                            status=200)

        return Response(status=401, data=serializer.errors)
