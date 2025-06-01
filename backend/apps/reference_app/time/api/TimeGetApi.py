from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reference_app.time.models import Time
from apps.reference_app.time.serializers import TimeSerializer


class TimeGetApi(APIView):

    def post(self, request):
        data = Time.objects.all().order_by('name')

        serializer = TimeSerializer(data, many=True)
        return Response({
            'data': serializer.data,
        })


