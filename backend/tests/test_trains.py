from datetime import date, time, timedelta
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.stations.models import Station
from apps.trains.models import Train, TrainClass, TrainSchedule, SeatInventory

class TrainTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.delhi = Station.objects.create(code='NDLS', name='New Delhi', city='New Delhi', state='Delhi')
        self.mumbai = Station.objects.create(code='MMCT', name='Mumbai Central', city='Mumbai', state='Maharashtra')

        self.train = Train.objects.create(
            train_number='12952',
            train_name='Mumbai Rajdhani Express',
            source_station=self.delhi,
            destination_station=self.mumbai,
            departure_time=time(16, 55),
            arrival_time=time(8, 35),
            running_days=["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
            duration_minutes=940,
            is_active=True
        )

        self.train_class = TrainClass.objects.create(
            train=self.train,
            class_code='3A',
            class_name='AC 3 Tier',
            base_fare=Decimal('1920.00'),
            total_seats=64
        )

        today = date.today()
        self.schedule = TrainSchedule.objects.create(
            train=self.train,
            journey_date=today,
            departure_datetime=timedelta(days=0) + train.departure_time.replace(microsecond=0) if False else None or '2026-10-10 16:55:00',
            arrival_datetime='2026-10-11 08:35:00',
            running_status='ON_TIME',
            delay_minutes=0
        )

        self.inventory = SeatInventory.objects.create(
            train_schedule=self.schedule,
            train_class=self.train_class,
            available_seats=45,
            booked_seats=19,
            version=1
        )

    def test_station_list_and_search(self):
        res = self.client.get('/api/stations/?search=Delhi')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(s['code'] == 'NDLS' for s in res.data['results']))

    def test_train_search_by_route(self):
        res = self.client.get(f'/api/trains/search/?source=NDLS&destination=MMCT&date={date.today()}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data['count'], 1)
        self.assertEqual(res.data['results'][0]['train_number'], '12952')

    def test_seat_availability_endpoint(self):
        res = self.client.get(f'/api/trains/availability/?train_id={self.train.id}&date={date.today()}&class=3A')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['availability'][0]['available_seats'], 45)

    def test_live_train_status(self):
        res = self.client.get(f'/api/trains/{self.train.train_number}/status/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('running_status', res.data)
        self.assertIn('delay_minutes', res.data)
        self.assertIn('is_simulated', res.data)
