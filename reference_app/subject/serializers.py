from apps.reference_app.subject.models import Subject

from rest_framework import serializers



class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = '__all__'

    name = serializers.CharField(read_only=True)
