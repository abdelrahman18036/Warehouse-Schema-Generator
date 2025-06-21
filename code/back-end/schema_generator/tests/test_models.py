import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from schema_generator.models import UserDatabase

User = get_user_model()

class UserModelTest(TestCase):
    """Test cases for the User model"""
    
    def setUp(self):
        """Set up test data"""
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'first_name': 'Test',
            'last_name': 'User',
            'password': 'testpass123'
        }
    
    def test_create_user(self):
        """Test creating a user with valid data"""
        user = User.objects.create_user(**self.user_data)
        
        self.assertEqual(user.email, self.user_data['email'])
        self.assertEqual(user.username, self.user_data['username'])
        self.assertEqual(user.first_name, self.user_data['first_name'])
        self.assertEqual(user.last_name, self.user_data['last_name'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
    
    def test_create_superuser(self):
        """Test creating a superuser"""
        user = User.objects.create_superuser(**self.user_data)
        
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
    
    def test_user_string_representation(self):
        """Test the string representation of User model"""
        user = User.objects.create_user(**self.user_data)
        expected_str = f"{self.user_data['first_name']} {self.user_data['last_name']} ({self.user_data['email']})"
        
        self.assertEqual(str(user), expected_str)
    
    def test_email_unique_constraint(self):
        """Test that email must be unique"""
        User.objects.create_user(**self.user_data)
        
        # Try to create another user with the same email
        duplicate_user_data = self.user_data.copy()
        duplicate_user_data['username'] = 'anotheruser'
        
        with self.assertRaises(IntegrityError):
            User.objects.create_user(**duplicate_user_data)
    
    def test_username_field_is_email(self):
        """Test that email is used as the username field"""
        self.assertEqual(User.USERNAME_FIELD, 'email')
    
    def test_required_fields(self):
        """Test the required fields"""
        expected_fields = ['username', 'first_name', 'last_name']
        self.assertEqual(User.REQUIRED_FIELDS, expected_fields)


class UserDatabaseModelTest(TestCase):
    """Test cases for the UserDatabase model"""
    
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
                    {'name': 'name', 'type': 'VARCHAR(100)', 'constraints': ['NOT NULL']},
                    {'name': 'email', 'type': 'VARCHAR(255)', 'constraints': ['UNIQUE']}
                ]
            }
        }
        
        self.database_data = {
            'user': self.user,
            'original_schema': self.sample_schema,
            'warehouse_schema': self.sample_schema,
            'ai_enhanced_schema': self.sample_schema,
            'domain': 'E-commerce',
            'schema_name': 'Test Schema'
        }
    
    def test_create_user_database(self):
        """Test creating a UserDatabase with valid data"""
        db = UserDatabase.objects.create(**self.database_data)
        
        self.assertEqual(db.user, self.user)
        self.assertEqual(db.original_schema, self.sample_schema)
        self.assertEqual(db.warehouse_schema, self.sample_schema)
        self.assertEqual(db.ai_enhanced_schema, self.sample_schema)
        self.assertEqual(db.domain, 'E-commerce')
        self.assertEqual(db.schema_name, 'Test Schema')
        self.assertIsNotNone(db.created_at)
        self.assertIsNotNone(db.updated_at)
    
    def test_user_database_string_representation(self):
        """Test the string representation of UserDatabase model"""
        db = UserDatabase.objects.create(**self.database_data)
        expected_str = f"{self.user.email} - {self.database_data['schema_name']} ({self.database_data['domain']})"
        
        self.assertEqual(str(db), expected_str)
    
    def test_default_schema_name(self):
        """Test default schema name when not provided"""
        data = self.database_data.copy()
        del data['schema_name']
        
        db = UserDatabase.objects.create(**data)
        self.assertEqual(db.schema_name, "Untitled Schema")
    
    def test_get_evaluation_summary_with_results(self):
        """Test get_evaluation_summary with evaluation results"""
        evaluation_results = {
            'warehouse_schema_evaluation': {'overall_score': 85.5},
            'ai_enhanced_schema_evaluation': {'overall_score': 92.3},
            'best_schema_recommendation': {'schema_type': 'ai_enhanced'}
        }
        
        data = self.database_data.copy()
        data['evaluation_results'] = evaluation_results
        
        db = UserDatabase.objects.create(**data)
        summary = db.get_evaluation_summary()
        
        self.assertIsNotNone(summary)
        self.assertEqual(summary['warehouse_score'], 85.5)
        self.assertEqual(summary['ai_enhanced_score'], 92.3)
        self.assertEqual(summary['best_schema'], 'ai_enhanced')
        self.assertEqual(summary['domain'], 'E-commerce')
        self.assertIn('created_at', summary)
    
    def test_get_evaluation_summary_without_results(self):
        """Test get_evaluation_summary without evaluation results"""
        db = UserDatabase.objects.create(**self.database_data)
        summary = db.get_evaluation_summary()
        
        self.assertIsNone(summary)
    
    def test_get_evaluation_summary_with_malformed_results(self):
        """Test get_evaluation_summary with malformed evaluation results"""
        data = self.database_data.copy()
        data['evaluation_results'] = {'invalid': 'data'}
        
        db = UserDatabase.objects.create(**data)
        summary = db.get_evaluation_summary()
        
        # The method returns a summary with default values for malformed data
        self.assertIsNotNone(summary)
        self.assertEqual(summary['warehouse_score'], 0)
        self.assertEqual(summary['ai_enhanced_score'], 0)
        self.assertEqual(summary['best_schema'], 'unknown')
    
    def test_ordering(self):
        """Test that UserDatabase objects are ordered by creation date (newest first)"""
        import time
        
        db1 = UserDatabase.objects.create(**self.database_data)
        
        # Small delay to ensure different creation times
        time.sleep(0.01)
        
        data2 = self.database_data.copy()
        data2['schema_name'] = 'Second Schema'
        db2 = UserDatabase.objects.create(**data2)
        
        databases = list(UserDatabase.objects.all())
        self.assertEqual(databases[0], db2)  # Newest first
        self.assertEqual(databases[1], db1)
    
    def test_user_cascade_delete(self):
        """Test that UserDatabase is deleted when user is deleted"""
        db = UserDatabase.objects.create(**self.database_data)
        self.assertTrue(UserDatabase.objects.filter(id=db.id).exists())
        
        self.user.delete()
        self.assertFalse(UserDatabase.objects.filter(id=db.id).exists())
    
    def test_user_relationship(self):
        """Test the relationship between User and UserDatabase"""
        db1 = UserDatabase.objects.create(**self.database_data)
        
        data2 = self.database_data.copy()
        data2['schema_name'] = 'Second Schema'
        db2 = UserDatabase.objects.create(**data2)
        
        # Test related manager
        user_databases = self.user.databases.all()
        self.assertEqual(len(user_databases), 2)
        self.assertIn(db1, user_databases)
        self.assertIn(db2, user_databases)
    
    def test_json_field_validation(self):
        """Test that JSON fields accept valid JSON data"""
        valid_json_data = {'test': 'data', 'nested': {'key': 'value'}}
        data = self.database_data.copy()
        data['original_schema'] = valid_json_data
        data['warehouse_schema'] = valid_json_data
        data['ai_enhanced_schema'] = valid_json_data
        data['evaluation_results'] = valid_json_data
        
        db = UserDatabase.objects.create(**data)
        self.assertEqual(db.original_schema, valid_json_data)
        self.assertEqual(db.warehouse_schema, valid_json_data)
        self.assertEqual(db.ai_enhanced_schema, valid_json_data)
        self.assertEqual(db.evaluation_results, valid_json_data)
    
    def test_evaluation_results_nullable(self):
        """Test that evaluation_results can be null"""
        data = self.database_data.copy()
        data['evaluation_results'] = None
        
        db = UserDatabase.objects.create(**data)
        self.assertIsNone(db.evaluation_results)
    
    def test_domain_max_length(self):
        """Test domain field max length"""
        data = self.database_data.copy()
        data['domain'] = 'A' * 100  # Max length
        
        db = UserDatabase.objects.create(**data)
        self.assertEqual(len(db.domain), 100)
    
    def test_schema_name_max_length(self):
        """Test schema_name field max length"""
        data = self.database_data.copy()
        data['schema_name'] = 'A' * 255  # Max length
        
        db = UserDatabase.objects.create(**data)
        self.assertEqual(len(db.schema_name), 255) 