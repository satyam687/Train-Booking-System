from rest_framework import generics, views, status, permissions
from rest_framework.response import Response
from django.db.models import Q, Min
from datetime import datetime, date, time
from django.utils import timezone
from apps.stations.models import Station
from .models import Train, TrainSchedule, SeatInventory, TrainClass
from .serializers import (
    TrainSerializer,
    TrainSearchResultSerializer,
    TrainScheduleSerializer,
    SeatInventorySerializer
)
from .services.status_provider import TrainStatusService
from .services.fare_service import FareService

class TrainListView(generics.ListAPIView):
    queryset = Train.objects.filter(is_active=True).prefetch_related('classes', 'source_station', 'destination_station')
    serializer_class = TrainSerializer
    search_fields = ('train_number', 'train_name', 'source_station__code', 'destination_station__code')


class TrainDetailView(generics.RetrieveAPIView):
    queryset = Train.objects.all().prefetch_related('classes', 'source_station', 'destination_station')
    serializer_class = TrainSerializer
    lookup_field = 'id'


class TrainSearchListView(views.APIView):
    """
    Search trains by source, destination, journey date, travel class, and filters.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        source_query = request.query_params.get('source', '').strip()
        dest_query = request.query_params.get('destination', '').strip()
        journey_date_str = request.query_params.get('date', '').strip()
        travel_class = request.query_params.get('travel_class', '').strip().upper()
        passengers = int(request.query_params.get('passengers', 1))

        # Filters
        min_fare = request.query_params.get('min_fare')
        max_fare = request.query_params.get('max_fare')
        departure_period = request.query_params.get('departure_period')
        max_duration = request.query_params.get('max_duration')
        available_only = request.query_params.get('available_only', 'false').lower() in ('true', '1')
        sort_by = request.query_params.get('sort_by', 'departure_asc')

        # Date parsing
        if journey_date_str:
            try:
                target_date = datetime.strptime(journey_date_str, '%Y-%m-%d').date()
            except ValueError:
                target_date = date.today()
        else:
            target_date = date.today()

        day_names = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
        day_of_week = day_names[target_date.weekday()]

        trains_query = Train.objects.filter(is_active=True)

        if source_query:
            trains_query = trains_query.filter(
                Q(source_station__code__iexact=source_query) |
                Q(source_station__name__icontains=source_query) |
                Q(source_station__city__icontains=source_query)
            )

        if dest_query:
            trains_query = trains_query.filter(
                Q(destination_station__code__iexact=dest_query) |
                Q(destination_station__name__icontains=dest_query) |
                Q(destination_station__city__icontains=dest_query)
            )

        trains = list(trains_query.prefetch_related('classes', 'source_station', 'destination_station'))

        # Filter by running day if train has running_days specified
        trains = [
            t for t in trains
            if not t.running_days or day_of_week in [d.upper() for d in t.running_days]
        ]

        # Attach schedule and live status
        results = []
        for train in trains:
            # Find or auto-build schedule for this date
            schedule = TrainSchedule.objects.filter(train=train, journey_date=target_date).first()
            if not schedule:
                # Auto instantiate demo schedule if not seeded
                dep_dt = datetime.combine(target_date, train.departure_time)
                arr_dt = dep_dt + timezone.timedelta(minutes=train.duration_minutes)
                schedule = TrainSchedule.objects.create(
                    train=train,
                    journey_date=target_date,
                    departure_datetime=timezone.make_aware(dep_dt) if timezone.is_naive(dep_dt) else dep_dt,
                    arrival_datetime=timezone.make_aware(arr_dt) if timezone.is_naive(arr_dt) else arr_dt,
                    running_status='ON_TIME',
                    delay_minutes=0
                )
                # Seed inventory for classes
                for tc in train.classes.all():
                    SeatInventory.objects.get_or_create(
                        train_schedule=schedule,
                        train_class=tc,
                        defaults={'available_seats': max(tc.total_seats - 12, 10), 'booked_seats': 12}
                    )

            train.matched_schedule = schedule
            train.status_info = TrainStatusService.get_train_status(train, target_date)
            matched_cls = travel_class or (train.classes.first().class_code if train.classes.exists() else '3A')
            train.fare_info = FareService.get_fare(
                train_number=train.train_number,
                source_station=train.source_station.code,
                destination_station=train.destination_station.code,
                journey_date=str(target_date),
                travel_class=matched_cls,
                quota='GN',
                passenger_count=passengers,
            )

            # Check class filter
            if travel_class:
                has_class = train.classes.filter(class_code=travel_class).exists()
                if not has_class:
                    continue

            # Check available only filter
            if available_only:
                has_avail = False
                for inv in schedule.seat_inventories.all():
                    if travel_class and inv.train_class.class_code != travel_class:
                        continue
                    if inv.available_seats >= passengers:
                        has_avail = True
                        break
                if not has_avail:
                    continue

            # Departure period filter
            dep_hour = train.departure_time.hour
            if departure_period == 'early_morning' and not (0 <= dep_hour < 6):
                continue
            elif departure_period == 'morning' and not (6 <= dep_hour < 12):
                continue
            elif departure_period == 'afternoon' and not (12 <= dep_hour < 18):
                continue
            elif departure_period == 'evening' and not (18 <= dep_hour < 24):
                continue

            # Max duration filter
            if max_duration and train.duration_minutes > int(max_duration):
                continue

            # Min/Max fare filter
            fares = [float(c.base_fare) for c in train.classes.all()]
            if fares:
                min_train_fare = min(fares)
                if min_fare and min_train_fare < float(min_fare):
                    continue
                if max_fare and min_train_fare > float(max_fare):
                    continue

            results.append(train)

        # Sorting
        if sort_by == 'fare_asc':
            results.sort(key=lambda t: min([float(c.base_fare) for c in t.classes.all()] or [99999]))
        elif sort_by == 'fare_desc':
            results.sort(key=lambda t: min([float(c.base_fare) for c in t.classes.all()] or [0]), reverse=True)
        elif sort_by == 'duration_asc':
            results.sort(key=lambda t: t.duration_minutes)
        elif sort_by == 'departure_asc':
            results.sort(key=lambda t: t.departure_time)

        serializer = TrainSearchResultSerializer(results, many=True)
        return Response({
            'count': len(results),
            'journey_date': str(target_date),
            'results': serializer.data
        })


class TrainLiveStatusView(views.APIView):
    """
    Get live running status and position of a train.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request, id):
        try:
            train = Train.objects.get(Q(id=id) | Q(train_number=id))
        except Train.DoesNotExist:
            return Response({'detail': 'Train not found.'}, status=status.HTTP_404_NOT_FOUND)

        journey_date_str = request.query_params.get('date')
        if journey_date_str:
            try:
                journey_date = datetime.strptime(journey_date_str, '%Y-%m-%d').date()
            except ValueError:
                journey_date = date.today()
        else:
            journey_date = date.today()

        status_data = TrainStatusService.get_train_status(train, journey_date)
        return Response(status_data)


class SeatAvailabilityView(views.APIView):
    """
    Direct seat availability query endpoint.
    GET /api/availability/?train_id=1&date=2026-10-15&class=3A
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        train_id = request.query_params.get('train_id')
        journey_date_str = request.query_params.get('date')
        class_code = request.query_params.get('class')

        if not train_id or not journey_date_str:
            return Response(
                {'detail': 'train_id and date query parameters are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            journey_date = datetime.strptime(journey_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        train = Train.objects.filter(Q(id=train_id) | Q(train_number=train_id)).first()
        if not train:
            return Response({'detail': 'Train not found.'}, status=status.HTTP_404_NOT_FOUND)

        schedule = TrainSchedule.objects.filter(train=train, journey_date=journey_date).first()
        if not schedule:
            return Response({'detail': 'No schedule found for this date.'}, status=status.HTTP_404_NOT_FOUND)

        inventories = schedule.seat_inventories.all()
        if class_code:
            inventories = inventories.filter(train_class__class_code=class_code.upper())

        return Response({
            'train_number': train.train_number,
            'train_name': train.train_name,
            'journey_date': str(journey_date),
            'availability': SeatInventorySerializer(inventories, many=True).data
        })
