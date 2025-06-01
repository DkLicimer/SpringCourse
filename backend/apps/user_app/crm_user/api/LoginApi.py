from django.contrib.auth import authenticate, login
from django.middleware import csrf
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.user_app.crm_user.serializers import LoginSerializer


class LoginApi(APIView):
    def post(self, request,):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = authenticate(request, username=serializer.data["login"],
                                    password=serializer.data["pas"])
            except Exception:
                return Response(data={'error':'Ошибка авторизации. Неверный логин/пароль'}, status=status.HTTP_401_UNAUTHORIZED)

            if user is not None:
                login(request, user)
                return Response({'csrftoken':csrf.get_token(request), 'sessionid':request.session.session_key}, status=status.HTTP_200_OK)

            return Response(data={'error':'Ошибка авторизации. Неверный логин/пароль'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
