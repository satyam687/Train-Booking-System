import unittest
from unittest.mock import patch, MagicMock
from decimal import Decimal
from datetime import date, time, timedelta
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.stations.models import Station
from apps.trains.models import Train, TrainClass, VerifiedFareRecord
from apps.trains.services.fare_service import FareService, AuthorizedRailwayFareProvider

class FareServiceTests(TestCase):
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
            duration_minutes=940
        )
        self.train_class = TrainClass.objects.create(
            train=self.train,
            class_code='3A',
            class_name='AC 3 Tier',
            base_fare=Decimal('1920.00'),
            total_seats=64
        )
        self.journey_date = date.today() + timedelta(days=7)

    @override_settings(RAILWAY_FARE_API_KEY='', RAILWAY_FARE_API_PROVIDER='')
    def test_missing_api_credentials(self):
        """
        Requirement 9 & 13: When credentials are not configured, display
        'Fare unavailable — connect an authorized fare provider.' Never invent prices as real.
        """
        self.assertFalse(FareService.is_provider_configured())

        res = FareService.get_fare(
            train_number='12952',
            source_station='NDLS',
            destination_station='MMCT',
            journey_date=str(self.journey_date),
            travel_class='3A',
        )

        self.assertEqual(res['fare_status'], 'UNAVAILABLE')
        self.assertFalse(res['is_verified'])
        self.assertIsNone(res['verified_fare'])
        self.assertEqual(res['detail'], 'Fare unavailable — connect an authorized fare provider.')
        # Demo fare is separate and labeled
        self.assertIsNotNone(res['demo_fare'])
        self.assertTrue(res['demo_fare']['is_demo'])
        self.assertIn('Demo Benchmark', res['demo_fare']['label'])

    @override_settings(
        RAILWAY_FARE_API_KEY='secret_auth_token_123',
        RAILWAY_FARE_API_PROVIDER='National Railway Fare Gateway',
        RAILWAY_FARE_API_URL='https://api.railway-fare.internal/v1',
        FARE_CACHE_TTL_MINUTES=60,
    )
    @patch('apps.trains.services.fare_service.requests.get')
    def test_valid_fare_retrieval_and_persistence(self, mock_get):
        """
        Requirement 4, 5 & 13: Valid response from authorized provider returns authentic
        breakdown and persists record into SQLite3.
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'provider_name': 'National Railway Fare Gateway',
            'quote_id': 'AUTH-Q-99881',
            'currency': 'INR',
            'base_fare': 1920.00,
            'reservation_charge': 40.00,
            'superfast_charge': 45.00,
            'gst_amount': 96.00,
            'tatkal_charge': 0.00,
            'other_charges': 0.00,
            'total_fare': 2101.00,
        }
        mock_get.return_value = mock_response

        res = FareService.get_fare(
            train_number='12952',
            source_station='NDLS',
            destination_station='MMCT',
            journey_date=str(self.journey_date),
            travel_class='3A',
            passenger_count=1,
            force_refresh=True,
        )

        self.assertEqual(res['fare_status'], 'VERIFIED')
        self.assertTrue(res['is_verified'])
        vf = res['verified_fare']
        self.assertEqual(vf['currency'], 'INR')
        self.assertEqual(vf['currency_symbol'], '₹')
        self.assertEqual(vf['base_fare'], 1920.00)
        self.assertEqual(vf['reservation_charge'], 40.00)
        self.assertEqual(vf['superfast_charge'], 45.00)
        self.assertEqual(vf['gst_amount'], 96.00)
        self.assertEqual(vf['total_fare'], 2101.00)

        # Confirm persisted in SQLite3 VerifiedFareRecord
        saved_record = VerifiedFareRecord.objects.filter(
            train_number='12952',
            travel_class='3A',
            source_station_code='NDLS',
            destination_station_code='MMCT',
        ).first()
        self.assertIsNotNone(saved_record)
        self.assertEqual(saved_record.total_fare, Decimal('2101.00'))
        self.assertEqual(saved_record.currency, 'INR')
        self.assertEqual(saved_record.source, 'National Railway Fare Gateway')
        self.assertTrue(saved_record.is_verified)

    @override_settings(
        RAILWAY_FARE_API_KEY='secret_auth_token_123',
        RAILWAY_FARE_API_PROVIDER='National Railway Fare Gateway',
        FARE_CACHE_TTL_MINUTES=60,
    )
    @patch('apps.trains.services.fare_service.requests.get')
    def test_stale_quotes_and_caching(self, mock_get):
        """
        Requirement 6 & 13: Caches results for configurable TTL and revalidates when stale.
        """
        now = timezone.now()

        # Create a fresh record (10 minutes old)
        fresh_record = VerifiedFareRecord.objects.create(
            train_number='12952',
            source_station_code='NDLS',
            destination_station_code='MMCT',
            journey_date=self.journey_date,
            travel_class='3A',
            quota='GN',
            passenger_count=1,
            currency='INR',
            base_fare=Decimal('1920.00'),
            reservation_charge=Decimal('40.00'),
            superfast_charge=Decimal('45.00'),
            gst_amount=Decimal('96.00'),
            total_fare=Decimal('2101.00'),
            source='National Railway Fare Gateway',
            retrieval_timestamp=now - timedelta(minutes=10),
            is_verified=True,
        )

        # Call get_fare: should use fresh cache without calling provider API
        res1 = FareService.get_fare(
            train_number='12952',
            source_station='NDLS',
            destination_station='MMCT',
            journey_date=str(self.journey_date),
            travel_class='3A',
        )
        self.assertTrue(res1['from_cache'])
        self.assertEqual(mock_get.call_count, 0)

        # Now simulate stale record by setting timestamp 65 minutes ago (TTL is 60m)
        fresh_record.retrieval_timestamp = now - timedelta(minutes=65)
        fresh_record.save()

        # Mock API returning refreshed quote
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'provider_name': 'National Railway Fare Gateway',
            'currency': 'INR',
            'base_fare': 1920.00,
            'reservation_charge': 40.00,
            'superfast_charge': 45.00,
            'gst_amount': 96.00,
            'total_fare': 2101.00,
        }
        mock_get.return_value = mock_response

        # Request again with force_refresh or expired cache
        res2 = FareService.get_fare(
            train_number='12952',
            source_station='NDLS',
            destination_station='MMCT',
            journey_date=str(self.journey_date),
            travel_class='3A',
            force_refresh=True,
        )
        self.assertFalse(res2['from_cache'])
        self.assertEqual(mock_get.call_count, 1)

    @override_settings(
        RAILWAY_FARE_API_KEY='secret_auth_token_123',
        RAILWAY_FARE_API_PROVIDER='National Railway Fare Gateway',
    )
    @patch('apps.trains.services.fare_service.requests.get')
    def test_provider_errors(self, mock_get):
        """
        Requirement 13: Handles provider HTTP error or timeout gracefully without crashing.
        """
        mock_response = MagicMock()
        mock_response.status_code = 502
        mock_response.json.return_value = {'detail': 'Gateway Timeout from Railway Central Database'}
        mock_get.return_value = mock_response

        res = FareService.get_fare(
            train_number='12952',
            source_station='NDLS',
            destination_station='MMCT',
            journey_date=str(self.journey_date),
            travel_class='3A',
            force_refresh=True,
        )

        self.assertEqual(res['fare_status'], 'PROVIDER_ERROR')
        self.assertFalse(res['is_verified'])
        self.assertIn('Gateway Timeout', res['detail'])

    @override_settings(
        RAILWAY_FARE_API_KEY='secret_auth_token_123',
        RAILWAY_FARE_API_PROVIDER='National Railway Fare Gateway',
    )
    @patch('apps.trains.services.fare_service.requests.get')
    def test_fare_changes_detected_before_booking(self, mock_get):
        """
        Requirement 6 & 13: Detects price change between initial quote and booking checkout.
        """
        # User saw ₹2,101 earlier, but provider now reports dynamic surge ₹2,350
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'provider_name': 'National Railway Fare Gateway',
            'currency': 'INR',
            'base_fare': 2150.00,
            'reservation_charge': 40.00,
            'superfast_charge': 45.00,
            'gst_amount': 115.00,
            'total_fare': 2350.00,
        }
        mock_get.return_value = mock_response

        reval = FareService.revalidate_quote_before_booking(
            train_number='12952',
            source_station='NDLS',
            destination_station='MMCT',
            journey_date=str(self.journey_date),
            travel_class='3A',
            expected_total_fare=Decimal('2101.00'),
        )

        self.assertFalse(reval['is_valid'])
        self.assertEqual(reval['reason'], 'FARE_CHANGED')
        self.assertEqual(reval['expected_fare'], 2101.00)
        self.assertEqual(reval['new_fare'], 2350.00)
        self.assertIn('Fare has changed', reval['detail'])

    def test_get_fares_api_endpoint(self):
        """
        Requirement 7: Test GET /api/fares/ validation and response.
        """
        # Missing required parameter 'train_number'
        resp_bad = self.client.get('/api/fares/?source=NDLS&destination=MMCT&date=2026-10-20')
        self.assertEqual(resp_bad.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid parameters (unconfigured provider returns 200 with UNAVAILABLE status)
        resp_ok = self.client.get(f'/api/fares/?train_number=12952&source=NDLS&destination=MMCT&date={self.journey_date}&travel_class=3A')
        self.assertEqual(resp_ok.status_code, status.HTTP_200_OK)
        self.assertIn('fare_status', resp_ok.data)
        self.assertIn('is_verified', resp_ok.data)

    def test_post_fare_quote_api_endpoint(self):
        """
        Requirement 7: Test POST /api/fares/quote/ validation and response.
        """
        # Invalid payload (missing travel_class)
        resp_bad = self.client.post('/api/fares/quote/', {
            'train_number': '12952',
            'source_station': 'NDLS',
            'destination_station': 'MMCT',
            'journey_date': str(self.journey_date),
        }, format='json')
        self.assertEqual(resp_bad.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid payload
        resp_ok = self.client.post('/api/fares/quote/', {
            'train_number': '12952',
            'source_station': 'NDLS',
            'destination_station': 'MMCT',
            'journey_date': str(self.journey_date),
            'travel_class': '3A',
            'passenger_count': 1,
        }, format='json')
        self.assertEqual(resp_ok.status_code, status.HTTP_200_OK)
        self.assertIn('fare_status', resp_ok.data)

    @override_settings(
        APIFY_API_TOKEN='mock_apify_token_456',
        APIFY_ACTOR_ID='scrapingshark/irctc-train-data-scraper',
        FARE_CACHE_TTL_MINUTES=60,
    )
    @patch('apps.trains.services.fare_service.requests.post')
    def test_apify_irctc_scraper_provider_success(self, mock_post):
        """
        Tests authentic IRCTC fare extraction using the Apify scrapingshark/irctc-train-data-scraper actor.
        """
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                "trainNo": "16021",
                "trainName": "KAVERI EXPRESS",
                "fromStnCode": "MAS",
                "toStnCode": "BNC",
                "availablityDate": "30-7-2025",
                "availablityStatus": "AVAILABLE-0009",
                "baseFare": "215",
                "reservationCharge": "20",
                "superfastCharge": "0",
                "serviceTax": "0.0",
                "tatkalFare": "0",
                "otherCharge": "0",
                "cateringCharge": "0",
                "dynamicFare": "0",
                "totalFare": "235",
                "totalCollectibleAmount": "235.0",
                "reqEnqParam": "16021#MAS#BNC#MAS#SL"
            }
        ]
        mock_post.return_value = mock_response

        # With apify token configured, is_provider_configured is True
        self.assertTrue(FareService.is_provider_configured())

        res = FareService.get_fare(
            train_number='16021',
            source_station='MAS',
            destination_station='BNC',
            journey_date='2025-07-30',
            travel_class='SL',
            quota='GN',
            passenger_count=1,
            force_refresh=True,
        )

        self.assertEqual(res['fare_status'], 'VERIFIED')
        self.assertTrue(res['is_verified'])
        vf = res['verified_fare']
        self.assertEqual(vf['base_fare'], 215.00)
        self.assertEqual(vf['reservation_charge'], 20.00)
        self.assertEqual(vf['superfast_charge'], 0.00)
        self.assertEqual(vf['total_fare'], 235.00)
        self.assertIn('IRCTC Portal via Apify (scrapingshark/irctc-train-data-scraper)', res['source'])
        self.assertEqual(vf['provider_quote_id'], 'APIFY-16021#MAS#BNC#MAS#SL')

        # Check SQLite persistence
        saved = VerifiedFareRecord.objects.filter(train_number='16021', travel_class='SL').first()
        self.assertIsNotNone(saved)
        self.assertEqual(saved.total_fare, Decimal('235.00'))
        self.assertTrue(saved.is_verified)
