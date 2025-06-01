from rest_framework import serializers

from apps.evaluation_app.evaluation.models import Evaluation


class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = '__all__'

class EvaluationSearchSerializer(serializers.Serializer):
    page = serializers.IntegerField(default=1)
    subject = serializers.CharField(allow_null=True, required=False)
    group = serializers.CharField(allow_null=True, required=False)
    sort_name = serializers.CharField(default='id', required=False)
    sort_order = serializers.CharField(default='up', required=False)
    show_all = serializers.BooleanField(default=False, required=False)