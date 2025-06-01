from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reference_app.group.models import Group
from apps.reference_app.group.serializers import GroupSerializer


class GroupGetApi(APIView):

    def post(self, request):
        data = Group.objects.all().order_by('name')

        serializer = GroupSerializer(data, many=True)
        return Response({
            'data': serializer.data,
        })


