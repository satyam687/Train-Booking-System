from rest_framework import serializers
from apps.trains.serializers import TrainClassSerializer, TrainScheduleSerializer
from .models import Booking, Passenger

class PassengerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Passenger
        fields = ('id', 'full_name', 'age', 'gender', 'seat_number', 'berth_preference')


class BookingSerializer(serializers.ModelSerializer):
    passengers = PassengerSerializer(many=True, read_only=True)
    train_number = serializers.CharField(source='train_schedule.train.train_number', read_only=True)
    train_name = serializers.CharField(source='train_schedule.train.train_name', read_only=True)
    source_station_name = serializers.CharField(source='train_schedule.train.source_station.name', read_only=True)
    source_station_code = serializers.CharField(source='train_schedule.train.source_station.code', read_only=True)
    destination_station_name = serializers.CharField(source='train_schedule.train.destination_station.name', read_only=True)
    destination_station_code = serializers.CharField(source='train_schedule.train.destination_station.code', read_only=True)
    departure_time = serializers.TimeField(source='train_schedule.train.departure_time', read_only=True)
    arrival_time = serializers.TimeField(source='train_schedule.train.arrival_time', read_only=True)
    class_code = serializers.CharField(source='train_class.class_code', read_only=True)
    class_name = serializers.CharField(source='train_class.class_name', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    is_sandbox_simulation = serializers.SerializerMethodField()
    reservation_disclaimer = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id',
            'booking_reference',
            'user',
            'user_name',
            'user_email',
            'train_schedule',
            'train_class',
            'train_number',
            'train_name',
            'source_station_name',
            'source_station_code',
            'destination_station_name',
            'destination_station_code',
            'departure_time',
            'arrival_time',
            'class_code',
            'class_name',
            'journey_date',
            'passenger_count',
            'base_fare_per_passenger',
            'service_fee',
            'total_fare',
            'booking_status',
            'payment_status',
            'passengers',
            'is_sandbox_simulation',
            'reservation_disclaimer',
            'created_at',
            'updated_at',
        )

    def get_is_sandbox_simulation(self, obj):
        return True

    def get_reservation_disclaimer(self, obj):
        return "Simulated reservation (Demonstration Mode). Connect an authorized railway booking service to issue official CRIS/IRCTC tickets."


class PassengerInputSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    age = serializers.IntegerField(min_value=1, max_value=120)
    gender = serializers.ChoiceField(choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    berth_preference = serializers.CharField(required=False, default='No Preference', allow_blank=True)


class CreateBookingSerializer(serializers.Serializer):
    schedule_id = serializers.IntegerField(required=True)
    class_code = serializers.CharField(max_length=10, required=True)
    passengers = PassengerInputSerializer(many=True, required=True)
    expected_fare = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    quota = serializers.CharField(max_length=10, required=False, default='GN')

    def validate_passengers(self, value):
        if not value:
            raise serializers.ValidationError("At least one passenger must be provided.")
        if len(value) > 6:
            raise serializers.ValidationError("Maximum 6 passengers allowed per booking.")
        return value
