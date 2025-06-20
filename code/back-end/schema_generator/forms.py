
from django import forms
from .models import UserDatabase

class UploadSchemaForm(forms.ModelForm):
    DOMAIN_CHOICES = [
        ('Auto-detect', 'Auto-detect'),
        ('E-commerce', 'E-commerce'),
        ('Healthcare', 'Healthcare'),
        ('Education', 'Education'),
        ('Finance', 'Finance'),
        ('Supply Chain', 'Supply Chain'),
        ('Social Media', 'Social Media'),
    ]

    domain = forms.ChoiceField(choices=DOMAIN_CHOICES, required=False)

    class Meta:
        model = UserDatabase
        fields = ['name', 'schema_file', 'domain']
