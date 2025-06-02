import math

from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.evaluation_app.evaluation.models import Evaluation
from apps.evaluation_app.evaluation.serializers import EvaluationSerializer, EvaluationSearchSerializer
from core.local_settings import LIMIT_ROW_ON_PAGE


class EvaluationGetApi(APIView):

    def post(self, request):
        # user_service.check_user(request)

        # для DV, иначе LV
        if 'id' in request.data:
            data = Evaluation.objects.get(id=request.data['id'])
            serializer = EvaluationSerializer(data, many=False)
            return Response({'data': serializer.data})


        serializer_in = EvaluationSearchSerializer(data=request.data)
        page = 1

        if serializer_in.is_valid():

            search = serializer_in.data

            data = Evaluation.objects.all()


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


            serializer = EvaluationSerializer(data, many=True)
            return Response({
                'data':serializer.data,
                'page_count': page_count,
                'items_count': items_count,
            })
        return Response(status=400, data=serializer_in.errors)



