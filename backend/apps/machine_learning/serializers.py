from rest_framework import serializers

class DemandPredictionRequestSerializer(serializers.Serializer):
    train_number = serializers.CharField(max_length=20, required=True)
    route = serializers.CharField(max_length=50, required=False, default='NDLS-MMCT')
    travel_class = serializers.CharField(max_length=10, required=False, default='3A')
    journey_date = serializers.DateField(required=False)

class RecommendationRequestSerializer(serializers.Serializer):
    source = serializers.CharField(max_length=50, required=True)
    destination = serializers.CharField(max_length=50, required=True)
    journey_date = serializers.DateField(required=False)
    travel_class = serializers.CharField(max_length=10, required=False, allow_blank=True)
    priority = serializers.ChoiceField(
        choices=['balanced', 'cheapest', 'fastest', 'timing'],
        default='balanced',
        required=False
    )
    departure_preference = serializers.ChoiceField(
        choices=['any', 'morning', 'afternoon', 'evening', 'night'],
        default='any',
        required=False
    )
