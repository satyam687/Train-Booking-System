import uuid
from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from apps.bookings.models import Booking
from apps.bookings.serializers import BookingSerializer
from apps.notifications.models import Notification
from .models import Payment
from .serializers import PaymentSerializer, DemoPaymentInputSerializer

class DemoPaymentProcessView(views.APIView):
    """
    Demo payment simulation endpoint.
    Safely confirms a booking without collecting real payment card data.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = DemoPaymentInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        booking_ref = data['booking_reference']
        payment_method = data['payment_method']

        booking = get_object_or_404(
            Booking.objects.select_related('train_schedule__train', 'train_class', 'user'),
            booking_reference=booking_ref
        )

        # Check ownership
        if not (request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN')):
            if booking.user != request.user:
                return Response(
                    {'detail': 'You do not have permission to pay for this booking.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        if booking.booking_status == 'CONFIRMED' and booking.payment_status == 'PAID':
            return Response(
                {'detail': 'This booking is already paid and confirmed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if booking.booking_status == 'CANCELLED':
            return Response(
                {'detail': 'Cannot process payment for a cancelled booking.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            txn_id = f"TXN-DEMO-{uuid.uuid4().hex[:10].upper()}"
            payment = Payment.objects.create(
                booking=booking,
                amount=booking.total_fare,
                payment_method=payment_method,
                transaction_reference=txn_id,
                payment_status='SUCCESS',
                is_demo=True
            )

            booking.booking_status = 'CONFIRMED'
            booking.payment_status = 'PAID'
            booking.save()

            Notification.objects.create(
                user=booking.user,
                title='Booking Confirmed & Paid',
                message=f'Booking {booking.booking_reference} confirmed! E-ticket is ready for download.',
                notification_type='BOOKING_CONFIRMED'
            )

        return Response({
            'message': 'Demo payment processed successfully. Booking confirmed!',
            'disclaimer': 'DEMO PAYMENT SIMULATION: No real currency or payment card details were processed.',
            'payment': PaymentSerializer(payment).data,
            'booking': BookingSerializer(booking).data
        }, status=status.HTTP_200_OK)


class PaymentDetailView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, reference):
        payment = get_object_or_404(
            Payment.objects.select_related('booking__user'),
            transaction_reference=reference
        )

        if not (request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN')):
            if payment.booking.user != request.user:
                return Response(
                    {'detail': 'You do not have permission to view this payment.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        return Response(PaymentSerializer(payment).data)
