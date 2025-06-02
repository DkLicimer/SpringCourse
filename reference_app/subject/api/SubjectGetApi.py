from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reference_app.group.models import Group
from apps.reference_app.group.serializers import GroupSerializer
from apps.reference_app.subject.models import Subject
from apps.reference_app.subject.serializers import SubjectSerializer


class SubjectGetApi(APIView):

    def post(self, request):
        data = Subject.objects.all().order_by('name')

        serializer = SubjectSerializer(data, many=True)
        return Response({
            'data': serializer.data,
        })


