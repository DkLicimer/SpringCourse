from rest_framework import serializers

from apps.user_app.crm_user.models import CrmUser


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField(required=True)
    pas = serializers.CharField(required=True)

from rest_framework import serializers



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrmUser
        exclude = [
            'password',
            'email',
            'date_joined',
            'last_login',
            'groups',
            'user_permissions',
        ]

    prava_list = serializers.SerializerMethodField()

    def get_prava_list(self, obj):
        tmp = []
        tmp.append('is_teacher') if obj.is_teacher else tmp
        tmp.append('is_superuser') if obj.is_superuser else tmp
        tmp.append('is_active') if obj.is_active else tmp
        return tmp


class RegistraziaSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    pas = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)
    fio = serializers.CharField(required=True)
