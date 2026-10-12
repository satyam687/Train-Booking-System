from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'
        self.change_pw_url = '/api/auth/change-password/'

    def test_user_registration_success(self):
        payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'StrongPassword123!',
            'first_name': 'New',
            'last_name': 'Passenger',
            'phone': '9876543210'
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'newuser')

    def test_user_registration_password_mismatch(self):
        payload = {
            'username': 'mismatch',
            'email': 'mismatch@example.com',
            'password': 'StrongPassword123!',
            'password_confirm': 'DifferentPassword123!',
        }
        res = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        user = User.objects.create_user(username='logintest', password='CorrectPassword123!')
        res = self.client.post(self.login_url, {
            'username': 'logintest',
            'password': 'CorrectPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)

    def test_user_login_invalid_credentials(self):
        res = self.client.post(self.login_url, {
            'username': 'nonexistent',
            'password': 'WrongPassword123!'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_jwt_protection(self):
        # Without token -> 401
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # With token -> 200
        user = User.objects.create_user(username='authuser', password='Password123!')
        self.client.force_authenticate(user=user)
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'authuser')
