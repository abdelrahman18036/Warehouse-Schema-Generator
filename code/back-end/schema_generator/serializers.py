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
            'ai_suggestions',
            'missing_tables',
            'missing_columns',
            'uploaded_at',
        ]

class SchemaUpdateSerializer(serializers.Serializer):
    schema = serializers.JSONField()
    
    def validate_schema(self, value):
        """
        Validate that the schema has the correct structure.
        """
        if not isinstance(value, dict):
            raise serializers.ValidationError("Schema must be a dictionary.")
        
        for table_name, table_info in value.items():
            if not isinstance(table_info, dict):
                raise serializers.ValidationError(f"Table '{table_name}' must be a dictionary.")
            
            if 'columns' not in table_info:
                raise serializers.ValidationError(f"Table '{table_name}' must have a 'columns' key.")
            
            if not isinstance(table_info['columns'], list):
                raise serializers.ValidationError(f"Table '{table_name}' columns must be a list.")
            
            for i, column in enumerate(table_info['columns']):
                if not isinstance(column, dict):
                    raise serializers.ValidationError(f"Column {i} in table '{table_name}' must be a dictionary.")
                
                required_keys = ['name', 'type', 'constraints']
                for key in required_keys:
                    if key not in column:
                        raise serializers.ValidationError(f"Column {i} in table '{table_name}' must have a '{key}' key.")
        
        return value
