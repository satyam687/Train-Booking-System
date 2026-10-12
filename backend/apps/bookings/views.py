import uuid
from decimal import Decimal
from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from rest_framework import generics, views, status, permissions
from rest_framework.response import Response
from apps.accounts.permissions import IsOwnerOrAdmin, IsAdminUserRole
from apps.trains.models import TrainSchedule, TrainClass, SeatInventory
from apps.notifications.models import Notification
from apps.trains.services.fare_service import FareService
from .models import Booking, Passenger
from .serializers import (
    BookingSerializer,
    CreateBookingSerializer,
    PassengerSerializer
)

class BookingListCreateView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        if user.is_staff or (hasattr(user, 'profile') and user.profile.role == 'ADMIN'):
            bookings = Booking.objects.all().prefetch_related('passengers', 'train_schedule__train')
        else:
            bookings = Booking.objects.filter(user=user).prefetch_related('passengers', 'train_schedule__train')

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        schedule_id = data['schedule_id']
        class_code = data['class_code'].upper()
        passengers_data = data['passengers']
        passenger_count = len(passengers_data)

        try:
            schedule = TrainSchedule.objects.select_related('train').get(id=schedule_id)
        except TrainSchedule.DoesNotExist:
            return Response({'detail': 'Train schedule not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            train_class = TrainClass.objects.get(train=schedule.train, class_code=class_code)
        except TrainClass.DoesNotExist:
            return Response({'detail': f'Class {class_code} not available on this train.'}, status=status.HTTP_404_NOT_FOUND)

        # Pre-booking fare revalidation with railway provider
        expected_fare = data.get('expected_fare')
        quota = data.get('quota', 'GN')
        if expected_fare is not None and FareService.is_provider_configured():
            reval = FareService.revalidate_quote_before_booking(
                train_number=schedule.train.train_number,
                source_station=schedule.train.source_station.code,
                destination_station=schedule.train.destination_station.code,
                journey_date=str(schedule.journey_date),
                travel_class=class_code,
                expected_total_fare=Decimal(str(expected_fare)),
                quota=quota,
                passenger_count=passenger_count,
            )
            if not reval.get('is_valid', True):
                if reval.get('reason') == 'FARE_CHANGED':
                    return Response({
                        'detail': reval.get('detail'),
                        'reason': 'FARE_CHANGED',
                        'expected_fare': reval.get('expected_fare'),
                        'new_fare': reval.get('new_fare'),
                    }, status=status.HTTP_409_CONFLICT)
                return Response({
                    'detail': reval.get('detail', 'Fare revalidation failed before booking.'),
                    'reason': reval.get('reason'),
                }, status=status.HTTP_400_BAD_REQUEST)

        # Atomic reservation transaction
        with transaction.atomic():
            # Lock and fetch inventory
            try:
                inventory = SeatInventory.objects.select_for_update().get(
                    train_schedule=schedule,
                    train_class=train_class
                )
            except SeatInventory.DoesNotExist:
                return Response(
                    {'detail': 'Seat inventory record not found for this schedule and class.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if inventory.available_seats < passenger_count:
                return Response(
                    {
                        'detail': f'Insufficient seat inventory. Requested {passenger_count}, but only {inventory.available_seats} seats remain.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Decrement inventory safely
            inventory.available_seats -= passenger_count
            inventory.booked_seats += passenger_count
            inventory.version += 1
            inventory.save()

            # Authoritative fare calculation (verified provider fare if active, otherwise benchmark tariff)
            if FareService.is_provider_configured():
                verified_quote = FareService.get_fare(
                    train_number=schedule.train.train_number,
                    source_station=schedule.train.source_station.code,
                    destination_station=schedule.train.destination_station.code,
                    journey_date=str(schedule.journey_date),
                    travel_class=class_code,
                    quota=quota,
                    passenger_count=passenger_count,
                )
                if verified_quote.get('fare_status') == 'VERIFIED' and verified_quote.get('verified_fare'):
                    vf = verified_quote['verified_fare']
                    base_fare_per_passenger = Decimal(str(vf['base_fare'])) / passenger_count
                    service_fee = Decimal(str(vf['reservation_charge'] + vf['superfast_charge'] + vf['gst_amount']))
                    total_fare = Decimal(str(vf['total_fare']))
                else:
                    base_fare_per_passenger = Decimal(str(train_class.base_fare))
                    subtotal = base_fare_per_passenger * passenger_count
                    service_fee = Decimal('25.00')
                    total_fare = subtotal + service_fee
            else:
                base_fare_per_passenger = Decimal(str(train_class.base_fare))
                subtotal = base_fare_per_passenger * passenger_count
                service_fee = Decimal('25.00')
                total_fare = subtotal + service_fee

            # Generate unique booking reference
            ref_uuid = uuid.uuid4().hex[:8].upper()
            booking_ref = f"RB-{schedule.train.train_number}-{ref_uuid}"

            # Create Booking
            booking = Booking.objects.create(
                booking_reference=booking_ref,
                user=request.user,
                train_schedule=schedule,
                train_class=train_class,
                journey_date=schedule.journey_date,
                passenger_count=passenger_count,
                base_fare_per_passenger=base_fare_per_passenger,
                service_fee=service_fee,
                total_fare=total_fare,
                booking_status='PENDING',
                payment_status='PENDING'
            )

            # Assign seat numbers
            coach_prefix = {
                '1A': 'H1',
                '2A': 'A1',
                '3A': 'B2',
                'SL': 'S4',
                'CC': 'C1',
                'EC': 'E1',
                '2S': 'D1'
            }.get(class_code, 'G1')

            created_passengers = []
            for i, p_info in enumerate(passengers_data, start=1):
                seat_num = f"{coach_prefix}-{inventory.booked_seats - passenger_count + i}"
                p = Passenger.objects.create(
                    booking=booking,
                    full_name=p_info['full_name'],
                    age=p_info['age'],
                    gender=p_info['gender'],
                    seat_number=seat_num,
                    berth_preference=p_info.get('berth_preference', 'No Preference')
                )
                created_passengers.append(p)

            # Create notification
            Notification.objects.create(
                user=request.user,
                title='Booking Initiated',
                message=f'Booking {booking_ref} created. Complete payment to confirm your e-ticket.',
                notification_type='STATUS_UPDATE'
            )

        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED
        )


class BookingDetailView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, reference):
        booking = get_object_or_404(
            Booking.objects.prefetch_related('passengers', 'train_schedule__train'),
            booking_reference=reference
        )

        # Check ownership
        if not (request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN')):
            if booking.user != request.user:
                return Response(
                    {'detail': 'You do not have permission to view this booking.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        return Response(BookingSerializer(booking).data)


class BookingCancelView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, reference):
        booking = get_object_or_404(
            Booking.objects.select_related('train_schedule', 'train_class'),
            booking_reference=reference
        )

        # Check ownership
        if not (request.user.is_staff or (hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN')):
            if booking.user != request.user:
                return Response(
                    {'detail': 'You do not have permission to cancel this booking.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        if booking.booking_status == 'CANCELLED':
            return Response(
                {'detail': 'This booking has already been cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Atomic seat inventory restoration
        with transaction.atomic():
            try:
                inventory = SeatInventory.objects.select_for_update().get(
                    train_schedule=booking.train_schedule,
                    train_class=booking.train_class
                )
                inventory.available_seats += booking.passenger_count
                inventory.booked_seats = max(0, inventory.booked_seats - booking.passenger_count)
                inventory.version += 1
                inventory.save()
            except SeatInventory.DoesNotExist:
                pass  # Continue cancellation even if inventory row missing

            booking.booking_status = 'CANCELLED'
            if booking.payment_status == 'PAID':
                booking.payment_status = 'REFUNDED'
            booking.save()

            Notification.objects.create(
                user=booking.user,
                title='Booking Cancelled',
                message=f'Booking {booking.booking_reference} has been cancelled and {booking.passenger_count} seats released.',
                notification_type='BOOKING_CANCELLED'
            )

        return Response({
            'message': 'Booking cancelled successfully. Seats restored.',
            'booking': BookingSerializer(booking).data
        }, status=status.HTTP_200_OK)
