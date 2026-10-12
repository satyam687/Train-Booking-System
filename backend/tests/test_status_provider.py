from django.test import TestCase, override_settings
from datetime import time
from apps.stations.models import Station
from apps.trains.models import Train
from apps.trains.services.status_provider import (
    TrainStatusService,
    MockTrainStatusProvider,
    RealTrainStatusProvider,
)

class StatusProviderTests(TestCase):
    def setUp(self):
        self.delhi = Station.objects.create(code='NDLS', name='New Delhi', city='New Delhi', state='Delhi')
        self.mumbai = Station.objects.create(code='MMCT', name='Mumbai Central', city='Mumbai', state='Maharashtra')
        self.train = Train.objects.create(
            train_number='12952',
            train_name='Rajdhani',
            source_station=self.delhi,
            destination_station=self.mumbai,
            departure_time=time(16, 55),
            arrival_time=time(8, 35),
            duration_minutes=940
        )

    def test_mock_provider_returns_standard_schema(self):
        provider = MockTrainStatusProvider()
        status_data = provider.get_live_status(self.train)

        self.assertEqual(status_data['train_number'], '12952')
        self.assertIn(status_data['running_status'], ['ON_TIME', 'DELAYED', 'CANCELLED', 'RESCHEDULED', 'DIVERTED'])
        self.assertIn('delay_minutes', status_data)
        self.assertIn('current_location', status_data)
        self.assertTrue(status_data['is_simulated'])
        self.assertIn('disclaimer', status_data)

    @override_settings(TRAIN_API_PROVIDER='real', TRAIN_API_KEY='')
    def test_missing_api_key_falls_back_to_mock_provider(self):
        provider = TrainStatusService.get_provider()
        self.assertIsInstance(provider, MockTrainStatusProvider)

    @override_settings(TRAIN_API_PROVIDER='mock')
    def test_cached_status_lookup(self):
        res1 = TrainStatusService.get_train_status(self.train)
        res2 = TrainStatusService.get_train_status(self.train)
        self.assertEqual(res1['last_updated'], res2['last_updated'])
        self.assertIn('freshness_seconds', res2)
