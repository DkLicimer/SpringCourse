from rest_framework import serializers

from apps.reference_app.time.models import Time


class TimeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Time
        fields = '__all__'

    name = serializers.CharField(read_only=True)
