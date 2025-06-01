from apps.reference_app.group.models import Group

from rest_framework import serializers



class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = '__all__'

    name = serializers.CharField(read_only=True)
