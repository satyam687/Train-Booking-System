from rest_framework import views, status, permissions
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .fare_serializers import FareQuerySerializer, FareQuoteRequestSerializer
from .services.fare_service import FareService

class FareQueryView(views.APIView):
    """
    GET /api/fares/
    Retrieve authentic railway fare for a given train, route, date, class, and quota.
    Returns verified breakdown if authorized provider is configured, or
    informative unavailable status if provider credentials are not connected.
    """
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Query authentic railway ticket fare",
        parameters=[
            OpenApiParameter(name='train_number', description='Train Number (e.g. 12952)', required=True, type=str),
            OpenApiParameter(name='source', description='Source Station Code (e.g. NDLS)', required=True, type=str),
            OpenApiParameter(name='destination', description='Destination Station Code (e.g. MMCT)', required=True, type=str),
            OpenApiParameter(name='date', description='Journey Date (YYYY-MM-DD)', required=True, type=str),
            OpenApiParameter(name='travel_class', description='Travel Class (e.g. 3A, 2A, 1A, SL)', required=False, type=str),
            OpenApiParameter(name='quota', description='Railway Quota (e.g. GN, TATKAL)', required=False, type=str),
            OpenApiParameter(name='passengers', description='Number of passengers (1-6)', required=False, type=int),
        ],
    )
    def get(self, request):
        serializer = FareQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        result = FareService.get_fare(
            train_number=data['train_number'],
            source_station=data['source'],
            destination_station=data['destination'],
            journey_date=data['date'],
            travel_class=data.get('travel_class', '3A'),
            quota=data.get('quota', 'GN'),
            passenger_count=data.get('passengers', 1),
        )
        return Response(result, status=status.HTTP_200_OK)


class FareQuoteView(views.APIView):
    """
    POST /api/fares/quote/
    Generate a formal fare quote from authorized railway provider with full breakdown.
    Persists authentic responses to SQLite3 audit log.
    """
    permission_classes = (permissions.AllowAny,)

    @extend_schema(
        summary="Request authorized railway fare quote",
        request=FareQuoteRequestSerializer,
    )
    def post(self, request):
        serializer = FareQuoteRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        result = FareService.get_fare(
            train_number=data['train_number'],
            source_station=data['source_station'],
            destination_station=data['destination_station'],
            journey_date=data['journey_date'],
            travel_class=data['travel_class'],
            quota=data.get('quota', 'GN'),
            passenger_count=data.get('passenger_count', 1),
        )

        resp_status = status.HTTP_200_OK
        if result.get('fare_status') == 'PROVIDER_ERROR':
            resp_status = status.HTTP_502_BAD_GATEWAY

        return Response(result, status=resp_status)
