import os
import json
from datetime import datetime, date, timedelta
from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.db.models import Q
from apps.trains.models import Train, TrainSchedule, SeatInventory
from ml.train_demand_model import predict_demand_for_train, METRICS_PATH
from ml.recommend_trains import compute_train_recommendations
from .models import DemandPredictionRecord
from .serializers import DemandPredictionRequestSerializer, RecommendationRequestSerializer

class DemandPredictionView(views.APIView):
    """
    Predicts ticket demand percentage and waitlist risk for a train, route, and journey date.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = DemandPredictionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        train_num = data['train_number']
        route = data.get('route', 'NDLS-MMCT')
        travel_class = data.get('travel_class', '3A')
        journey_date = str(data.get('journey_date', date.today() + timedelta(days=7)))

        # Run ML model prediction
        result = predict_demand_for_train(
            train_number=train_num,
            route=route,
            travel_class=travel_class,
            journey_date_str=journey_date
        )

        # Log prediction
        DemandPredictionRecord.objects.create(
            train_number=train_num,
            route=route,
            travel_class=travel_class,
            journey_date=journey_date,
            predicted_demand=result['predicted_demand_percentage'],
            demand_level=result['demand_level'],
            model_version=result['model_version'],
            is_synthetic=True
        )

        return Response(result, status=status.HTTP_200_OK)


class TrainRecommendationsView(views.APIView):
    """
    AI-powered multi-attribute train recommendations with transparent scoring.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = RecommendationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        source_str = data['source'].strip()
        dest_str = data['destination'].strip()
        target_date = data.get('journey_date') or (date.today() + timedelta(days=1))
        travel_class = data.get('travel_class')

        # Find matching trains
        trains_query = Train.objects.filter(is_active=True).filter(
            (Q(source_station__code__iexact=source_str) | Q(source_station__name__icontains=source_str) | Q(source_station__city__icontains=source_str)) &
            (Q(destination_station__code__iexact=dest_str) | Q(destination_station__name__icontains=dest_str) | Q(destination_station__city__icontains=dest_str))
        ).prefetch_related('classes', 'source_station', 'destination_station')

        candidates = list(trains_query)
        # If none matched directly, get general trains on any similar route for demonstration
        if not candidates:
            candidates = list(Train.objects.filter(is_active=True).prefetch_related('classes', 'source_station', 'destination_station')[:5])

        # Prepare payload for recommendation engine
        trains_payload = []
        for train in candidates:
            fares = [float(c.base_fare) for c in train.classes.all()]
            min_fare = min(fares) if fares else 500.0

            schedule = TrainSchedule.objects.filter(train=train, journey_date=target_date).first()
            avail_seats = 35
            if schedule:
                inv = schedule.seat_inventories.first()
                if inv:
                    avail_seats = inv.available_seats

            trains_payload.append({
                'id': train.id,
                'train_number': train.train_number,
                'train_name': train.train_name,
                'source': train.source_station.name,
                'source_code': train.source_station.code,
                'destination': train.destination_station.name,
                'destination_code': train.destination_station.code,
                'duration_minutes': train.duration_minutes,
                'min_fare': min_fare,
                'available_seats': avail_seats,
                'departure_time': train.departure_time.strftime('%H:%M'),
                'arrival_time': train.arrival_time.strftime('%H:%M'),
                'classes': [{'code': c.class_code, 'name': c.class_name, 'fare': float(c.base_fare)} for c in train.classes.all()]
            })

        recommendations = compute_train_recommendations(
            trains_payload,
            preferences={
                'priority': data.get('priority', 'balanced'),
                'departure_preference': data.get('departure_preference', 'any')
            }
        )

        return Response({
            'source': source_str,
            'destination': dest_str,
            'journey_date': str(target_date),
            'preference': data.get('priority', 'balanced'),
            'recommendations': recommendations
        }, status=status.HTTP_200_OK)


class ModelInfoView(views.APIView):
    """
    Returns trained ML model architecture, evaluation metrics, and provenance.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        if os.path.exists(METRICS_PATH):
            try:
                with open(METRICS_PATH, 'r') as f:
                    metrics = json.load(f)
                return Response(metrics)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'version': 'v1.2-randomforest',
            'status': 'Model not yet trained. Run python manage.py train_demand_model.',
            'algorithm': 'RandomForestRegressor'
        })


class FareInsightsView(views.APIView):
    """
    Returns demand projection and fare variation trends across the next 14 days.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        route = request.query_params.get('route', 'NDLS-MMCT')
        base_fare = float(request.query_params.get('base_fare', 1450.0))

        today = date.today()
        trends = []
        for d in range(14):
            day_date = today + timedelta(days=d)
            dow = day_date.weekday()
            is_wknd = dow in [4, 5, 6]

            # Estimated demand factor
            demand_pct = 50.0 + (25.0 if is_wknd else 5.0) + max(0, (7 - d) * 3)
            demand_pct = min(98.0, demand_pct)

            surge_multiplier = 1.0 + (0.15 if demand_pct > 80 else (0.05 if demand_pct > 65 else 0.0))
            projected_fare = round(base_fare * surge_multiplier, 0)

            trends.append({
                'date': str(day_date),
                'day_name': day_date.strftime('%a'),
                'is_weekend': is_wknd,
                'demand_percentage': round(demand_pct, 1),
                'projected_fare': projected_fare,
                'surge_multiplier': round(surge_multiplier, 2),
                'status': 'HIGH_DEMAND' if demand_pct > 75 else ('MODERATE' if demand_pct > 50 else 'LOW')
            })

        return Response({
            'route': route,
            'base_fare': base_fare,
            'disclaimer': 'ESTIMATED TRENDS: For planning purposes only; not official dynamic rail pricing.',
            'trends': trends
        })
