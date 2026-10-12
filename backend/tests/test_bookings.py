from datetime import date, time
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.stations.models import Station
from apps.trains.models import Train, TrainClass, TrainSchedule, SeatInventory
from apps.bookings.models import Booking, Passenger

class BookingWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(username='passenger1', password='Password123!')
        self.user2 = User.objects.create_user(username='passenger2', password='Password123!')

        self.delhi = Station.objects.create(code='NDLS', name='New Delhi', city='New Delhi', state='Delhi')
        self.varanasi = Station.objects.create(code='BSB', name='Varanasi', city='Varanasi', state='UP')

        self.train = Train.objects.create(
            train_number='22436',
            train_name='Vande Bharat Express',
            source_station=self.delhi,
            destination_station=self.varanasi,
            departure_time=time(6, 0),
            arrival_time=time(14, 0),
            running_days=["TUE", "WED", "FRI", "SAT", "SUN"],
            duration_minutes=480,
            is_active=True
        )

        self.train_class = TrainClass.objects.create(
            train=self.train,
            class_code='CC',
            class_name='AC Chair Car',
            base_fare=Decimal('1280.00'),
            total_seats=78
        )

        today = date.today()
        self.schedule = TrainSchedule.objects.create(
            train=self.train,
            journey_date=today,
            departure_datetime='2026-10-10 06:00:00',
            arrival_datetime='2026-10-10 14:00:00',
            running_status='ON_TIME',
            delay_minutes=0
        )

        self.inventory = SeatInventory.objects.create(
            train_schedule=self.schedule,
            train_class=self.train_class,
            available_seats=5,  # Only 5 seats available
            booked_seats=73,
            version=1
        )

    def test_successful_booking_and_fare_calculation(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            'schedule_id': self.schedule.id,
            'class_code': 'CC',
            'passengers': [
                {'full_name': 'Test Passenger 1', 'age': 30, 'gender': 'M', 'berth_preference': 'Window'},
                {'full_name': 'Test Passenger 2', 'age': 28, 'gender': 'F', 'berth_preference': 'Aisle'},
            ]
        }
        res = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Authoritative server-side fare: 1280 * 2 + 25 = 2585.00
        self.assertEqual(Decimal(res.data['total_fare']), Decimal('2585.00'))
        self.assertEqual(res.data['booking_status'], 'PENDING')
        self.assertEqual(res.data['passenger_count'], 2)

        # Inventory decreased
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.available_seats, 3)
        self.assertEqual(self.inventory.booked_seats, 75)

    def test_insufficient_seats_error(self):
        self.client.force_authenticate(user=self.user1)
        payload = {
            'schedule_id': self.schedule.id,
            'class_code': 'CC',
            'passengers': [{'full_name': f'Passenger {i}', 'age': 25, 'gender': 'M'} for i in range(6)]
        }
        res = self.client.post('/api/bookings/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Insufficient seat inventory', res.data['detail'])

        # Inventory unchanged
        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.available_seats, 5)

    def test_user_ownership_permissions(self):
        # Create booking for user1
        booking = Booking.objects.create(
            booking_reference='RB-TEST-001',
            user=self.user1,
            train_schedule=self.schedule,
            train_class=self.train_class,
            journey_date=date.today(),
            passenger_count=1,
            base_fare_per_passenger=Decimal('1280.00'),
            service_fee=Decimal('25.00'),
            total_fare=Decimal('1305.00'),
            booking_status='PENDING'
        )

        # user2 should be forbidden from accessing user1's booking
        self.client.force_authenticate(user=self.user2)
        res = self.client.get(f'/api/bookings/{booking.booking_reference}/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # user1 should succeed
        self.client.force_authenticate(user=self.user1)
        res = self.client.get(f'/api/bookings/{booking.booking_reference}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_booking_cancellation_restores_inventory(self):
        self.client.force_authenticate(user=self.user1)
        booking = Booking.objects.create(
            booking_reference='RB-TEST-002',
            user=self.user1,
            train_schedule=self.schedule,
            train_class=self.train_class,
            journey_date=date.today(),
            passenger_count=2,
            base_fare_per_passenger=Decimal('1280.00'),
            service_fee=Decimal('25.00'),
            total_fare=Decimal('2585.00'),
            booking_status='CONFIRMED',
            payment_status='PAID'
        )

        init_avail = self.inventory.available_seats
        res = self.client.post(f'/api/bookings/{booking.booking_reference}/cancel/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        booking.refresh_from_db()
        self.assertEqual(booking.booking_status, 'CANCELLED')
        self.assertEqual(booking.payment_status, 'REFUNDED')

        self.inventory.refresh_from_db()
        self.assertEqual(self.inventory.available_seats, init_avail + 2)
