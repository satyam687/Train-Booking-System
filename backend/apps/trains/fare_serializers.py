from rest_framework import serializers

class FareQuerySerializer(serializers.Serializer):
    """
    Validation serializer for GET /api/fares/ query parameters.
    """
    train_number = serializers.CharField(max_length=10, required=True)
    source = serializers.CharField(max_length=10, required=True)
    destination = serializers.CharField(max_length=10, required=True)
    date = serializers.DateField(required=True)
    travel_class = serializers.CharField(max_length=5, required=False, default='3A')
    quota = serializers.CharField(max_length=10, required=False, default='GN')
    passengers = serializers.IntegerField(min_value=1, max_value=6, required=False, default=1)


class FareQuoteRequestSerializer(serializers.Serializer):
    """
    Validation serializer for POST /api/fares/quote/ request body.
    """
    train_number = serializers.CharField(max_length=10, required=True)
    source_station = serializers.CharField(max_length=10, required=True)
    destination_station = serializers.CharField(max_length=10, required=True)
    journey_date = serializers.DateField(required=True)
    travel_class = serializers.CharField(max_length=5, required=True)
    quota = serializers.CharField(max_length=10, required=False, default='GN')
    passenger_count = serializers.IntegerField(min_value=1, max_value=6, required=False, default=1)
