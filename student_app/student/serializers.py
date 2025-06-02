from rest_framework import serializers
from sorl.thumbnail import get_thumbnail

from apps.bludo_app.bludo.models import Bludo
from apps.bludo_app.sostav_bluda.serializers import SostavBludaSerializer
from core.local_settings import BASE_URL


class BludoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bludo
        fields = '__all__'


    photo = serializers.SerializerMethodField( read_only=True)
    kategoria_bluda_nazvanie = serializers.SlugRelatedField(
        many=False,
        read_only=True,
        source='kategoria_bluda',
        slug_field='nazvanie',
     )

    sostav = SostavBludaSerializer(many=True, read_only=True, source='sostav_set')


    def get_photo(self, obj):
        if obj.photo:
            return f"{BASE_URL}{get_thumbnail(obj.photo, '400x250', crop='center', quality=99).url}"
        return ''



class BludoSearchSerializer(serializers.Serializer):
    page = serializers.IntegerField(default=1)
    term = serializers.CharField(allow_null=True, required=False, allow_blank=True)
    kategoria = serializers.CharField(allow_null=True, required=False)
    is_archive = serializers.BooleanField(default=False, )
    sort_name = serializers.CharField(default='id', required=False)
    sort_order = serializers.CharField(default='up', required=False)
    show_all = serializers.BooleanField(default=False, required=False)