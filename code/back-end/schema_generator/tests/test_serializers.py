from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from schema_generator.models import UserDatabase
from schema_generator.serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserDatabaseSerializer,
    UserDatabaseListSerializer,
    SchemaUpdateSerializer
)

User = get_user_model()

class UserRegistrationSerializerTest(TestCase):
    """Test cases for UserRegistrationSerializer"""
    
    def setUp(self):
        """Set up test data"""
        self.valid_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123!',
            'password_confirm': 'testpass123!'
        }
    
    def test_valid_registration_data(self):
        """Test serializer with valid registration data"""
        serializer = UserRegistrationSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        
        user = serializer.save()
        self.assertEqual(user.email, self.valid_data['email'])
        self.assertEqual(user.username, self.valid_data['username'])
        self.assertEqual(user.first_name, self.valid_data['first_name'])
        self.assertEqual(user.last_name, self.valid_data['last_name'])
        self.assertTrue(user.check_password(self.valid_data['password']))
    
    def test_password_mismatch(self):
        """Test validation when passwords don't match"""
        data = self.valid_data.copy()
        data['password_confirm'] = 'differentpassword'
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertIn("Passwords don't match", str(serializer.errors))
    
    def test_invalid_email_format(self):
        """Test validation with invalid email format"""
        data = self.valid_data.copy()
        data['email'] = 'invalid-email'
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_duplicate_email(self):
        """Test validation with duplicate email"""
        # Create a user first
        User.objects.create_user(
            email=self.valid_data['email'],
            username='existinguser',
            first_name='Existing',
            last_name='User',
            password='password123'
        )
        
        # Try to register with same email
        data = self.valid_data.copy()
        data['username'] = 'newuser'
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
    
    def test_required_fields(self):
        """Test validation with missing required fields"""
        required_fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password_confirm']
        
        for field in required_fields:
            data = self.valid_data.copy()
            del data[field]
            
            serializer = UserRegistrationSerializer(data=data)
            self.assertFalse(serializer.is_valid())
            self.assertIn(field, serializer.errors)
    
    def test_password_validation(self):
        """Test password validation (weak password)"""
        data = self.valid_data.copy()
        data['password'] = '123'  # Too short and weak
        data['password_confirm'] = '123'
        
        serializer = UserRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)


class UserLoginSerializerTest(TestCase):
    """Test cases for UserLoginSerializer"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        
        self.valid_login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
    
    def test_valid_login_credentials(self):
        """Test serializer with valid login credentials"""
        serializer = UserLoginSerializer(data=self.valid_login_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['user'], self.user)
    
    def test_invalid_email(self):
        """Test login with invalid email"""
        data = self.valid_login_data.copy()
        data['email'] = 'nonexistent@example.com'
        
        serializer = UserLoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertIn('Invalid credentials', str(serializer.errors))
    
    def test_invalid_password(self):
        """Test login with invalid password"""
        data = self.valid_login_data.copy()
        data['password'] = 'wrongpassword'
        
        serializer = UserLoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertIn('Invalid credentials', str(serializer.errors))
    
    def test_inactive_user(self):
        """Test login with inactive user"""
        self.user.is_active = False
        self.user.save()
        
        serializer = UserLoginSerializer(data=self.valid_login_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        # Check that login fails for inactive user (may show as invalid credentials)
        self.assertTrue('Invalid credentials' in str(serializer.errors) or 'User account is disabled' in str(serializer.errors))
    
    def test_missing_credentials(self):
        """Test login with missing credentials"""
        # Missing email
        data = {'password': 'testpass123'}
        serializer = UserLoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        
        # Missing password
        data = {'email': 'test@example.com'}
        serializer = UserLoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)


class UserSerializerTest(TestCase):
    """Test cases for UserSerializer"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
    
    def test_user_serialization(self):
        """Test serializing a user instance"""
        serializer = UserSerializer(self.user)
        data = serializer.data
        
        self.assertEqual(data['email'], self.user.email)
        self.assertEqual(data['username'], self.user.username)
        self.assertEqual(data['first_name'], self.user.first_name)
        self.assertEqual(data['last_name'], self.user.last_name)
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertNotIn('password', data)  # Password should not be serialized
    
    def test_read_only_fields(self):
        """Test that read-only fields cannot be updated"""
        update_data = {
            'id': 999,
            'created_at': '2023-01-01T00:00:00Z',
            'email': 'updated@example.com'
        }
        
        serializer = UserSerializer(self.user, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        
        updated_user = serializer.save()
        # ID and created_at should not change
        self.assertEqual(updated_user.id, self.user.id)
        self.assertEqual(updated_user.created_at, self.user.created_at)
        # Email should change
        self.assertEqual(updated_user.email, 'updated@example.com')


class UserDatabaseSerializerTest(TestCase):
    """Test cases for UserDatabaseSerializer"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        
        self.sample_schema = {
            'customers': {
                'columns': [
                    {'name': 'id', 'type': 'INTEGER', 'constraints': ['PRIMARY KEY']},
                    {'name': 'name', 'type': 'VARCHAR(100)', 'constraints': ['NOT NULL']}
                ]
            }
        }
        
        self.evaluation_results = {
            'warehouse_schema_evaluation': {'overall_score': 85.5},
            'ai_enhanced_schema_evaluation': {'overall_score': 92.3},
            'best_schema_recommendation': {'schema_type': 'ai_enhanced'}
        }
        
        self.database = UserDatabase.objects.create(
            user=self.user,
            original_schema=self.sample_schema,
            warehouse_schema=self.sample_schema,
            ai_enhanced_schema=self.sample_schema,
            domain='E-commerce',
            schema_name='Test Schema',
            evaluation_results=self.evaluation_results
        )
    
    def test_user_database_serialization(self):
        """Test serializing a UserDatabase instance"""
        serializer = UserDatabaseSerializer(self.database)
        data = serializer.data
        
        self.assertEqual(data['schema_name'], 'Test Schema')
        self.assertEqual(data['domain'], 'E-commerce')
        self.assertEqual(data['original_schema'], self.sample_schema)
        self.assertEqual(data['warehouse_schema'], self.sample_schema)
        self.assertEqual(data['ai_enhanced_schema'], self.sample_schema)
        self.assertEqual(data['evaluation_results'], self.evaluation_results)
        self.assertIn('user', data)
        self.assertIn('evaluation_summary', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
    
    def test_evaluation_summary_method(self):
        """Test the evaluation_summary method"""
        serializer = UserDatabaseSerializer(self.database)
        data = serializer.data
        
        summary = data['evaluation_summary']
        self.assertIsNotNone(summary)
        self.assertEqual(summary['warehouse_score'], 85.5)
        self.assertEqual(summary['ai_enhanced_score'], 92.3)
        self.assertEqual(summary['best_schema'], 'ai_enhanced')
        self.assertEqual(summary['domain'], 'E-commerce')
    
    def test_user_nested_serialization(self):
        """Test nested user serialization"""
        serializer = UserDatabaseSerializer(self.database)
        data = serializer.data
        
        user_data = data['user']
        self.assertEqual(user_data['email'], self.user.email)
        self.assertEqual(user_data['first_name'], self.user.first_name)
        self.assertEqual(user_data['last_name'], self.user.last_name)


class UserDatabaseListSerializerTest(TestCase):
    """Test cases for UserDatabaseListSerializer"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        
        self.sample_schema = {
            'customers': {
                'columns': [
                    {'name': 'id', 'type': 'INTEGER', 'constraints': ['PRIMARY KEY']},
                    {'name': 'name', 'type': 'VARCHAR(100)', 'constraints': ['NOT NULL']}
                ]
            }
        }
        
        self.database = UserDatabase.objects.create(
            user=self.user,
            original_schema=self.sample_schema,
            warehouse_schema=self.sample_schema,
            ai_enhanced_schema=self.sample_schema,
            domain='E-commerce',
            schema_name='Test Schema'
        )
    
    def test_list_serialization(self):
        """Test serializing for list view (limited fields)"""
        serializer = UserDatabaseListSerializer(self.database)
        data = serializer.data
        
        # Should include these fields
        self.assertIn('id', data)
        self.assertIn('schema_name', data)
        self.assertIn('domain', data)
        self.assertIn('evaluation_summary', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
        
        # Should not include these fields (not in Meta.fields)
        self.assertNotIn('original_schema', data)
        self.assertNotIn('warehouse_schema', data)
        self.assertNotIn('ai_enhanced_schema', data)
        self.assertNotIn('evaluation_results', data)
        self.assertNotIn('user', data)


class SchemaUpdateSerializerTest(TestCase):
    """Test cases for SchemaUpdateSerializer"""
    
    def setUp(self):
        """Set up test data"""
        self.valid_schema = {
            'customers': {
                'columns': [
                    {
                        'name': 'id',
                        'type': 'INTEGER',
                        'constraints': ['PRIMARY KEY']
                    },
                    {
                        'name': 'name',
                        'type': 'VARCHAR(100)',
                        'constraints': ['NOT NULL']
                    }
                ]
            }
        }
    
    def test_valid_schema(self):
        """Test serializer with valid schema data"""
        data = {'schema': self.valid_schema}
        serializer = SchemaUpdateSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['schema'], self.valid_schema)
    
    def test_invalid_schema_not_dict(self):
        """Test validation when schema is not a dictionary"""
        data = {'schema': 'not a dict'}
        serializer = SchemaUpdateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('schema', serializer.errors)
        self.assertIn('must be a dictionary', str(serializer.errors))
    
    def test_invalid_table_not_dict(self):
        """Test validation when table info is not a dictionary"""
        invalid_schema = {
            'customers': 'not a dict'
        }
        data = {'schema': invalid_schema}
        serializer = SchemaUpdateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('schema', serializer.errors)
        self.assertIn('must be a dictionary', str(serializer.errors))
    
    def test_missing_columns_key(self):
        """Test validation when table is missing columns key"""
        invalid_schema = {
            'customers': {
                'not_columns': []
            }
        }
        data = {'schema': invalid_schema}
        serializer = SchemaUpdateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('schema', serializer.errors)
        self.assertIn('must have a \'columns\' key', str(serializer.errors))
    
    def test_columns_not_list(self):
        """Test validation when columns is not a list"""
        invalid_schema = {
            'customers': {
                'columns': 'not a list'
            }
        }
        data = {'schema': invalid_schema}
        serializer = SchemaUpdateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('schema', serializer.errors)
        self.assertIn('columns must be a list', str(serializer.errors))
    
    def test_column_not_dict(self):
        """Test validation when column is not a dictionary"""
        invalid_schema = {
            'customers': {
                'columns': ['not a dict']
            }
        }
        data = {'schema': invalid_schema}
        serializer = SchemaUpdateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('schema', serializer.errors)
        self.assertIn('must be a dictionary', str(serializer.errors))
    
    def test_column_missing_required_keys(self):
        """Test validation when column is missing required keys"""
        required_keys = ['name', 'type', 'constraints']
        
        for missing_key in required_keys:
            invalid_column = {
                'name': 'id',
                'type': 'INTEGER',
                'constraints': ['PRIMARY KEY']
            }
            del invalid_column[missing_key]
            
            invalid_schema = {
                'customers': {
                    'columns': [invalid_column]
                }
            }
            data = {'schema': invalid_schema}
            serializer = SchemaUpdateSerializer(data=data)
            
            self.assertFalse(serializer.is_valid())
            self.assertIn('schema', serializer.errors)
            self.assertIn(f'must have a \'{missing_key}\' key', str(serializer.errors))
    
    def test_empty_schema(self):
        """Test validation with empty schema"""
        data = {'schema': {}}
        serializer = SchemaUpdateSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())  # Empty schema is valid
    
    def test_missing_schema_field(self):
        """Test validation when schema field is missing"""
        data = {}
        serializer = SchemaUpdateSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('schema', serializer.errors) 