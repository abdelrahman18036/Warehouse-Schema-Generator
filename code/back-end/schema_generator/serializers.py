# schema_generator/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, UserDatabase

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'username', 'first_name', 'last_name', 'password', 'password_confirm')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return attrs

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'created_at')
        read_only_fields = ('id', 'created_at')

class UserDatabaseSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    evaluation_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = UserDatabase
        fields = ('id', 'user', 'schema_name', 'domain', 'original_schema', 
                 'warehouse_schema', 'ai_enhanced_schema', 'evaluation_results', 
                 'evaluation_summary', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
    
    def get_evaluation_summary(self, obj):
        return obj.get_evaluation_summary()

class UserDatabaseListSerializer(serializers.ModelSerializer):
    evaluation_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = UserDatabase
        fields = ('id', 'schema_name', 'domain', 'evaluation_summary', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')
    
    def get_evaluation_summary(self, obj):
        return obj.get_evaluation_summary()

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
