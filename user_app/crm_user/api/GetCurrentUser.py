from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.user_app.crm_user.UserService import user_service
from apps.user_app.crm_user.serializers import UserSerializer


class GetCurrentUser(APIView):
    """Вернёт текущего пользователя если есть"""
    def post(self, request):
        user_service.check_user(request)
        if request.user.is_active:
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        return Response(status=status.HTTP_400_BAD_REQUEST, data={'error':'Вы не вошли в систему'})