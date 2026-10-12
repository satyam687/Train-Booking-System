from datetime import date, time
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.stations.models import Station
from apps.trains.models import Train, TrainClass, TrainSchedule, SeatInventory
from apps.bookings.models import Booking

class PaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='paymentuser', password='Password123!')
        self.delhi = Station.objects.create(code='NDLS', name='New Delhi', city='New Delhi', state='Delhi')
        self.mumbai = Station.objects.create(code='MMCT', name='Mumbai', city='Mumbai', state='MH')

        self.train = Train.objects.create(
            train_number='12952',
            train_name='Rajdhani',
            source_station=self.delhi,
            destination_station=self.mumbai,
            departure_time=time(16, 55),
            arrival_time=time(8, 35),
            duration_minutes=940
        )
        self.train_class = TrainClass.objects.create(
            train=self.train,
            class_code='3A',
            class_name='AC 3 Tier',
            base_fare=Decimal('1920.00'),
            total_seats=64
        )
        self.schedule = TrainSchedule.objects.create(
            train=self.train,
            journey_date=date.today(),
            departure_datetime='2026-10-10 16:55:00',
            arrival_datetime='2026-10-11 08:35:00',
            running_status='ON_TIME'
        )
        self.booking = Booking.objects.create(
            booking_reference='RB-PAY-001',
            user=self.user,
            train_schedule=self.schedule,
            train_class=self.train_class,
            journey_date=date.today(),
            passenger_count=1,
            base_fare_per_passenger=Decimal('1920.00'),
            service_fee=Decimal('25.00'),
            total_fare=Decimal('1945.00'),
            booking_status='PENDING',
            payment_status='PENDING'
        )

    def test_demo_payment_confirmation(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'booking_reference': self.booking.booking_reference,
            'payment_method': 'UPI'
        }
        res = self.client.post('/api/payments/demo/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('payment', res.data)
        self.assertEqual(res.data['payment']['payment_status'], 'SUCCESS')

        self.booking.refresh_from_db()
        self.assertEqual(self.booking.booking_status, 'CONFIRMED')
        self.assertEqual(self.booking.payment_status, 'PAID')

    def test_demo_payment_duplicate_prevention(self):
        self.client.force_authenticate(user=self.user)
        self.booking.booking_status = 'CONFIRMED'
        self.booking.payment_status = 'PAID'
        self.booking.save()

        payload = {'booking_reference': self.booking.booking_reference}
        res = self.client.post('/api/payments/demo/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already paid', res.data['detail'])
