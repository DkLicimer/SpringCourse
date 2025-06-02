from rest_framework import serializers

from apps.quick_test_app.quick_test.models import QuickTest


class QuickTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuickTest
        fields = '__all__'



class QuickTestSearchSerializer(serializers.Serializer):


    rating = serializers.IntegerField(max_value=5, min_value=1, required=False)
    time_stamp = serializers.DateTimeField(required=False)
    time_since_start = serializers.IntegerField(default=0, max_value= 90, required=False)
