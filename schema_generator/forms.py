# schema_generator/forms.py
from django import forms
from .models import UserDatabase

class UploadSchemaForm(forms.ModelForm):
    class Meta:
        model = UserDatabase
        fields = ['name', 'schema_file']
