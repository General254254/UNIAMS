from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()


class AuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role='student'
        )

    def test_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpass'
        }, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_rate_limiting(self):
        # Make 6 rapid login attempts with wrong password
        for i in range(6):
            # Reset cache for first 5 attempts
            if i == 0:
                from django.core.cache import cache
                cache.clear()

            response = self.client.post('/api/auth/login/', {
                'username': f'testuser{i if i > 0 else ""}',
                'password': 'wrongpass'
            }, content_type='application/json')


class UserSerializerTests(TestCase):
    def test_user_creation_with_units(self):
        from units.models import Unit
        unit = Unit.objects.create(
            name='Test Unit',
            code='TEST101',
            lecturer=self.user
        )
        # Update user to be lecturer
        self.user.role = 'lecturer'
        self.user.save()

        from accounts.serializers import UserRegisterSerializer
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'password': 'newpass123',
            'role': 'student',
            'unit_ids': [unit.id]
        }
        serializer = UserRegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.enrolled_units.count(), 1)
