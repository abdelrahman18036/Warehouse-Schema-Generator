import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from schema_generator.models import UserDatabase

User = get_user_model()

class AuthenticationAPITest(APITestCase):
    """Test cases for authentication API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123!',
            'password_confirm': 'testpass123!'
        }
    
    def test_user_registration_success(self):
        """Test successful user registration"""
        response = self.client.post('/api/schema/auth/register/', self.user_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['email'], self.user_data['email'])
    
    def test_user_login_success(self):
        """Test successful user login"""
        user_creation_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123!'
        }
        User.objects.create_user(**user_creation_data)
        
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123!'
        }
        
        response = self.client.post('/api/schema/auth/login/', login_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)


class UserDatabaseAPITest(APITestCase):
    """Test cases for UserDatabase API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        self.sample_schema = {
            'customers': {
                'columns': [
                    {'name': 'id', 'type': 'INTEGER', 'constraints': ['PRIMARY KEY']},
                    {'name': 'name', 'type': 'VARCHAR(100)', 'constraints': ['NOT NULL']}
                ]
            }
        }
        
        self.user_database = UserDatabase.objects.create(
            user=self.user,
            original_schema=self.sample_schema,
            warehouse_schema=self.sample_schema,
            ai_enhanced_schema=self.sample_schema,
            domain='E-commerce',
            schema_name='Test Schema'
        )
    
    def test_get_user_schemas_authenticated(self):
        """Test getting user schemas with authentication"""
        response = self.client.get('/api/schema/dashboard/schemas/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_get_user_schemas_unauthenticated(self):
        """Test getting user schemas without authentication"""
        self.client.credentials()
        response = self.client.get('/api/schema/dashboard/schemas/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_schema_authenticated(self):
        """Test deleting schema with authentication"""
        response = self.client.delete(f'/api/schema/dashboard/schemas/{self.user_database.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(UserDatabase.objects.filter(id=self.user_database.id).exists())


class DashboardAPITest(APITestCase):
    """Test cases for Dashboard API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        UserDatabase.objects.create(
            user=self.user,
            original_schema={'test': 'schema'},
            warehouse_schema={'test': 'schema'},
            ai_enhanced_schema={'test': 'schema'},
            domain='E-commerce',
            schema_name='Schema 1'
        )
    
    def test_get_dashboard_data_authenticated(self):
        """Test getting dashboard data with authentication"""
        response = self.client.get('/api/schema/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('statistics', response.data)
        self.assertIn('domain_distribution', response.data)
        self.assertIn('recent_schemas', response.data)
    
    def test_get_dashboard_data_unauthenticated(self):
        """Test getting dashboard data without authentication"""
        self.client.credentials()
        response = self.client.get('/api/schema/dashboard/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 