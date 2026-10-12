from rest_framework import serializers
from apps.stations.serializers import StationSerializer
from .models import Train, TrainClass, TrainSchedule, SeatInventory, LiveStatusUpdateLog

class TrainClassSerializer(serializers.ModelSerializer):
    superfast_charge = serializers.SerializerMethodField()
    reservation_charge = serializers.SerializerMethodField()
    gst_amount = serializers.SerializerMethodField()
    total_fare = serializers.SerializerMethodField()

    class Meta:
        model = TrainClass
        fields = (
            'id',
            'class_code',
            'class_name',
            'base_fare',
            'superfast_charge',
            'reservation_charge',
            'gst_amount',
            'total_fare',
            'total_seats',
        )

    def get_superfast_charge(self, obj):
        return 45.0 if obj.class_code in ['1A', '2A', '3A', 'CC', 'EC'] else 30.0

    def get_reservation_charge(self, obj):
        res_map = {'1A': 60.0, 'EC': 60.0, '2A': 50.0, '3A': 40.0, 'CC': 40.0, 'SL': 20.0, '2S': 15.0}
        return res_map.get(obj.class_code, 30.0)

    def get_gst_amount(self, obj):
        if obj.class_code in ['1A', '2A', '3A', 'CC', 'EC']:
            return round(float(obj.base_fare) * 0.05, 2)
        return 0.0

    def get_total_fare(self, obj):
        base = float(obj.base_fare)
        sf = self.get_superfast_charge(obj)
        res = self.get_reservation_charge(obj)
        gst = self.get_gst_amount(obj)
        return round(base + sf + res + gst, 2)


class SeatInventorySerializer(serializers.ModelSerializer):
    class_code = serializers.CharField(source='train_class.class_code', read_only=True)
    class_name = serializers.CharField(source='train_class.class_name', read_only=True)
    base_fare = serializers.DecimalField(source='train_class.base_fare', max_digits=10, decimal_places=2, read_only=True)
    total_fare = serializers.SerializerMethodField()

    class Meta:
        model = SeatInventory
        fields = ('id', 'train_class', 'class_code', 'class_name', 'base_fare', 'total_fare', 'available_seats', 'booked_seats')

    def get_total_fare(self, obj):
        tc = obj.train_class
        base = float(tc.base_fare)
        sf = 45.0 if tc.class_code in ['1A', '2A', '3A', 'CC', 'EC'] else 30.0
        res = {'1A': 60.0, 'EC': 60.0, '2A': 50.0, '3A': 40.0, 'CC': 40.0, 'SL': 20.0, '2S': 15.0}.get(tc.class_code, 30.0)
        gst = round(base * 0.05, 2) if tc.class_code in ['1A', '2A', '3A', 'CC', 'EC'] else 0.0
        return round(base + sf + res + gst, 2)



class TrainScheduleSerializer(serializers.ModelSerializer):
    seat_inventories = SeatInventorySerializer(many=True, read_only=True)

    class Meta:
        model = TrainSchedule
        fields = (
            'id',
            'train',
            'journey_date',
            'departure_datetime',
            'arrival_datetime',
            'running_status',
            'delay_minutes',
            'current_location',
            'last_updated',
            'seat_inventories',
        )


class TrainSerializer(serializers.ModelSerializer):
    source_station_detail = StationSerializer(source='source_station', read_only=True)
    destination_station_detail = StationSerializer(source='destination_station', read_only=True)
    classes = TrainClassSerializer(many=True, read_only=True)

    class Meta:
        model = Train
        fields = (
            'id',
            'train_number',
            'train_name',
            'source_station',
            'destination_station',
            'source_station_detail',
            'destination_station_detail',
            'intermediate_stations',
            'departure_time',
            'arrival_time',
            'running_days',
            'duration_minutes',
            'is_active',
            'classes',
            'image_url',
            'display_image_url',
        )


class TrainSearchResultSerializer(serializers.ModelSerializer):
    source_station = StationSerializer(read_only=True)
    destination_station = StationSerializer(read_only=True)
    classes = TrainClassSerializer(many=True, read_only=True)
    schedule = serializers.SerializerMethodField()
    live_status = serializers.SerializerMethodField()
    fare_info = serializers.SerializerMethodField()

    class Meta:
        model = Train
        fields = (
            'id',
            'train_number',
            'train_name',
            'source_station',
            'destination_station',
            'intermediate_stations',
            'departure_time',
            'arrival_time',
            'running_days',
            'duration_minutes',
            'classes',
            'schedule',
            'live_status',
            'fare_info',
            'image_url',
            'display_image_url',
        )

    def get_schedule(self, obj):
        schedule = getattr(obj, 'matched_schedule', None)
        if schedule:
            return TrainScheduleSerializer(schedule).data
        return None

    def get_live_status(self, obj):
        return getattr(obj, 'status_info', None)

    def get_fare_info(self, obj):
        return getattr(obj, 'fare_info', None)
