# schema_generator/serializers.py

from rest_framework import serializers
from .models import UserDatabase

class UserDatabaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDatabase
        fields = [
            'id',
            'schema_file',
            'domain',
            'original_schema',
            'warehouse_schema',
            'ai_enhanced_schema',
            'ai_suggestions',
            'missing_tables',
            'missing_columns',
            'uploaded_at',
        ]
        read_only_fields = [
            'original_schema',
            'warehouse_schema',
            'ai_enhanced_schema',
            'ai_suggestions',
            'missing_tables',
            'missing_columns',
            'uploaded_at',
        ]
