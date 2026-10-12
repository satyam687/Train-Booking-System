from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    booking_reference = serializers.CharField(source='booking.booking_reference', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id',
            'booking_reference',
            'amount',
            'payment_method',
            'transaction_reference',
            'payment_status',
            'is_demo',
            'created_at'
        )

class DemoPaymentInputSerializer(serializers.Serializer):
    booking_reference = serializers.CharField(required=True)
    payment_method = serializers.ChoiceField(
        choices=Payment.PAYMENT_METHOD_CHOICES,
        default='UPI'
    )
