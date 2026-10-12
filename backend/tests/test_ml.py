from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta

class MLTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_demand_prediction_endpoint(self):
        payload = {
            'train_number': '12951',
            'route': 'MMCT-NDLS',
            'travel_class': '3A',
            'journey_date': str(date.today() + timedelta(days=5))
        }
        res = self.client.post('/api/ml/demand-prediction/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('predicted_demand_percentage', res.data)
        self.assertIn('demand_level', res.data)
        self.assertIn('booking_advice', res.data)
        self.assertTrue(res.data['is_synthetic_demonstration'])

    def test_train_recommendations_endpoint(self):
        payload = {
            'source': 'NDLS',
            'destination': 'MMCT',
            'priority': 'cheapest'
        }
        res = self.client.post('/api/ml/recommendations/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('recommendations', res.data)

    def test_model_info_endpoint(self):
        res = self.client.get('/api/ml/model-info/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('version', res.data)

    def test_fare_insights_endpoint(self):
        res = self.client.get('/api/ml/fare-insights/?route=NDLS-MMCT&base_fare=1500')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('trends', res.data)
        self.assertEqual(len(res.data['trends']), 14)
