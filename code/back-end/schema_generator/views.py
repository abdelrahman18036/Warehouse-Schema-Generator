# schema_generator/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserDatabaseSerializer
from .models import UserDatabase
from .utils.schema_parsing import parse_sql_file
from .utils.schema_generation import generate_warehouse_schema
from .ai_services import (
    detect_domain_with_ai,
    suggest_missing_elements,
    generate_enhanced_schema_with_ai
)
from django.shortcuts import get_object_or_404

class UploadSchemaAPIView(APIView):
    def post(self, request, format=None):
        serializer = UserDatabaseSerializer(data=request.data)
        if serializer.is_valid():
            user_db = serializer.save()
            schema_details = parse_sql_file(user_db.schema_file.path)

            # Determine domain
            domain = serializer.validated_data.get('domain')
            if not domain or domain == 'Auto-detect':
                domain = detect_domain_with_ai(schema_details)
                user_db.domain = domain
                user_db.save(update_fields=['domain'])

            # Generate warehouse schema
            warehouse_schema, missing_tables, missing_columns = generate_warehouse_schema(schema_details, domain)

            # Process warehouse_schema to add pk_columns and fk_columns
            for table_type in ['fact_tables', 'dimension_tables']:
                tables = warehouse_schema.get(table_type, {})
                for table_name, table_info in tables.items():
                    # Extract primary key columns
                    pk_columns = set(table_info.get('primary_keys', []))
                    table_info['pk_columns'] = list(pk_columns)

                    # Extract foreign key columns
                    fk_columns = set(fk['column'] for fk in table_info.get('foreign_keys', []))
                    table_info['fk_columns'] = list(fk_columns)

            # Use AI to generate the enhanced schema
            ai_enhanced_schema = generate_enhanced_schema_with_ai(schema_details, domain)

            # Process ai_enhanced_schema to add pk_columns and fk_columns if possible
            for table_name, table_info in ai_enhanced_schema.items():
                columns = table_info.get('columns', [])
                pk_columns = set()
                fk_columns = set()
                for column in columns:
                    constraints = column.get('constraints', [])
                    column_name = column.get('name')

                    # Normalize constraints to a list of strings
                    if isinstance(constraints, list):
                        constraints_list = [str(c).lower() for c in constraints]
                    elif isinstance(constraints, str):
                        constraints_list = [constraints.lower()]
                    else:
                        constraints_list = []

                    # Check for primary key and foreign key constraints
                    if any('primary key' in c for c in constraints_list):
                        pk_columns.add(column_name)
                    if any('foreign key' in c for c in constraints_list):
                        fk_columns.add(column_name)
                table_info['pk_columns'] = list(pk_columns)
                table_info['fk_columns'] = list(fk_columns)

            # AI suggestions
            ai_suggestions = suggest_missing_elements(schema_details, domain)

            # Update the user_db instance with all processed data
            user_db.original_schema = schema_details
            user_db.warehouse_schema = warehouse_schema
            user_db.ai_enhanced_schema = ai_enhanced_schema
            user_db.ai_suggestions = ai_suggestions
            user_db.missing_tables = missing_tables
            user_db.missing_columns = missing_columns
            user_db.save(update_fields=[
                'original_schema',
                'warehouse_schema',
                'ai_enhanced_schema',
                'ai_suggestions',
                'missing_tables',
                'missing_columns',
            ])

            response_data = {
                'message': 'Schema uploaded and processed successfully.',
                'id': user_db.id,
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BaseUserDatabaseAPIView(APIView):
    def get_user_db(self, pk):
        return get_object_or_404(UserDatabase, pk=pk)

class OriginalSchemaAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        if user_db.original_schema:
            return Response(user_db.original_schema, status=status.HTTP_200_OK)
        return Response({'error': 'Original schema not found.'}, status=status.HTTP_404_NOT_FOUND)

class WarehouseSchemaAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        if user_db.warehouse_schema:
            return Response(user_db.warehouse_schema, status=status.HTTP_200_OK)
        return Response({'error': 'Warehouse schema not found.'}, status=status.HTTP_404_NOT_FOUND)

class AIEnhancedSchemaAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        if user_db.ai_enhanced_schema:
            return Response(user_db.ai_enhanced_schema, status=status.HTTP_200_OK)
        return Response({'error': 'AI enhanced schema not found.'}, status=status.HTTP_404_NOT_FOUND)

class MetadataAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        metadata = {
            'domain': user_db.domain,
            'ai_suggestions': user_db.ai_suggestions,
            'missing_tables': user_db.missing_tables,
            'missing_columns': user_db.missing_columns,
        }
        return Response(metadata, status=status.HTTP_200_OK)
