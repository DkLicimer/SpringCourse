import math

from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.evaluation_app.evaluation.models import Evaluation
from apps.evaluation_app.evaluation.serializers import EvaluationSerializer
from apps.schedule_app.schedule.models import Schedule
from apps.schedule_app.schedule.serializers import ScheduleSerializer, ScheduleSearchSerializer

from apps.quick_test_app.quick_test.models import QuickTest
from apps.quick_test_app.quick_test.serializers import QuickTestSerializer, QuickTestSearchSerializer
from core.local_settings import LIMIT_ROW_ON_PAGE


class QuickTestPostApi(APIView):

    def post(self, request, id):
        # user_service.check_user(request)

        # для DV, иначе LV
        if id:
            evaluations = Evaluation.objects.filter(quick_test_id=id)
            serializer = EvaluationSerializer(evaluations, many=True)
            return Response({'data': serializer.data})


        serializer_in = QuickTestSearchSerializer(data=request.data)
        page = 1

        if serializer_in.is_valid():

            search = serializer_in.data

            data = QuickTest.objects.all()


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

class QuickStartStatisticsApi(APIView):
    def get(self, request, schedule_id):
        evaluations = Evaluation.objects.filter(quick_test_id=quick_test_id)

        stats = {
            "total": evaluations.count(),
            "use_methods": evaluations.filter(use_methods=True).count(),
            "use_examples": evaluations.filter(use_examples=True).count(),
            "is_consistently": evaluations.filter(is_consistently=True).count(),
            "is_interesting": evaluations.filter(is_interesting=True).count(),
            "were_questions": evaluations.filter(were_questions=True).count(),
            "losing_attention": evaluations.filter(losing_attention=True).count(),
            "liked": evaluations.filter(liked=True).count(),
            "confused": evaluations.filter(confused=True).count(),
            "stressed": evaluations.filter(stressed=True).count(),
            "questions": list(
                evaluations.exclude(questions__isnull=True).exclude(questions="").values_list("questions", flat=True))
        }

        return JsonResponse({"data": stats})
