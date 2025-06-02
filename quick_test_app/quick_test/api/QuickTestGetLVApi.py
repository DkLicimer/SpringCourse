import math

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.quick_test_app.quick_test.models import QuickTest
from apps.schedule_app.schedule.models import Schedule
from apps.quick_test_app.quick_test.serializers import QuickTestSerializer, QuickTestSearchSerializer
from apps.schedule_app.schedule.serializers import ScheduleSerializer, ScheduleSearchSerializer
from core.local_settings import LIMIT_ROW_ON_PAGE


class QuickTestGetLvApi(APIView):

    def post(self, request):
        # user_service.check_user(request)

        # для DV, иначе LV
        if 'id' in request.data:
            data = QuickTest.objects.get(id=request.data['id'])
            serializer = QuickTestSerializer(data, many=False)
            return Response({'data': serializer.data})


        serializer_in = QuickTestSearchSerializer(data=request.data)
        page = 1

        if serializer_in.is_valid():

            search = serializer_in.data

            data = Schedule.objects.all()


            if search['page']:
                page = search['page']

            # if search['kategoria']:
            #     data = data.filter(s=search['kategoria'] )


            sort_name = search['sort_name']
            if search['sort_order'] == 'down':
                sort_name = f"-{search['sort_name']}"

            data = data.order_by(sort_name)
            items_count = len(data)

            if search['show_all']:
                page_count = 1
            else:
                page_count = math.ceil(len(data) / LIMIT_ROW_ON_PAGE)
                page_index_start = (page - 1) * LIMIT_ROW_ON_PAGE
                page_index_end = page * LIMIT_ROW_ON_PAGE
                data = data[page_index_start:page_index_end]


            serializer = QuickTestSerializer(data, many=True)
            return Response({
                'data':serializer.data,
                'page_count': page_count,
                'items_count': items_count,
            })
        return Response(status=400, data=serializer_in.errors)



