from django.test import TestCase
from schema_generator.forms import UploadSchemaForm


class UploadSchemaFormTest(TestCase):
    """Test cases for UploadSchemaForm"""
    
    def test_form_fields(self):
        """Test that form has required fields"""
        form = UploadSchemaForm()
        
        self.assertIn('schema_name', form.fields)
        self.assertIn('domain', form.fields)
    
    def test_form_validation_with_valid_data(self):
        """Test form validation with valid data"""
        form_data = {
            'schema_name': 'Test Schema',
            'domain': 'E-commerce'
        }
        
        form = UploadSchemaForm(data=form_data)
        self.assertTrue(form.is_valid())
    
    def test_form_validation_missing_required_fields(self):
        """Test form validation with missing required fields"""
        form = UploadSchemaForm(data={})
        self.assertFalse(form.is_valid()) 