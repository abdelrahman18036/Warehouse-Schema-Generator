# schema_generator/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserDatabaseSerializer
from .models import UserDatabase
from .utils.schema_parsing import parse_sql_file
from .utils.evaluation import evaluation_framework
from .ai_services import (
    detect_domain_with_ai,
    suggest_missing_elements,
    generate_warehouse_schema_with_ai,
    generate_full_detailed_ai_warehouse
)
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
import json
import os
import tempfile
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.conf import settings
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserSerializer,
    UserDatabaseListSerializer,
    SchemaUpdateSerializer
)
from .utils.schema_parsing import parse_sql_file
from .ai_services import generate_ai_suggestions
from .utils.evaluation import evaluate_schemas

def validate_schema_structure(schema, schema_name="schema"):
    """
    Validate that the schema has the correct structure.
    
    Args:
        schema (dict): The schema to validate
        schema_name (str): Name for logging purposes
        
    Returns:
        bool: True if valid, False otherwise
    """
    if not isinstance(schema, dict):
        print(f"Error: {schema_name} is not a dictionary: {type(schema)}")
        return False
    
    for table_name, table_info in schema.items():
        if not isinstance(table_info, dict):
            print(f"Error: {schema_name} table '{table_name}' is not a dictionary: {type(table_info)}")
            return False
        
        if 'columns' not in table_info:
            print(f"Error: {schema_name} table '{table_name}' missing 'columns' key")
            return False
        
        if not isinstance(table_info['columns'], list):
            print(f"Error: {schema_name} table '{table_name}' columns is not a list: {type(table_info['columns'])}")
            return False
        
        for i, column in enumerate(table_info['columns']):
            if not isinstance(column, dict):
                print(f"Error: {schema_name} table '{table_name}' column {i} is not a dictionary: {type(column)}")
                return False
            
            # Check for required keys and provide defaults
            if 'name' not in column:
                print(f"Error: {schema_name} table '{table_name}' column {i} missing 'name' key")
                return False
            
            if 'type' not in column:
                print(f"Error: {schema_name} table '{table_name}' column {i} missing 'type' key")
                return False
            
            # Provide default empty constraints if missing
            if 'constraints' not in column:
                column['constraints'] = []
    
    return True

def convert_schema_format(schema_details):
    """
    Convert schema from parsing format to the required API format.
    
    Args:
        schema_details (dict): Schema in parsing format
        
    Returns:
        dict: Schema in the required format
    """
    converted_schema = {}
    
    for table_name, table_info in schema_details.items():
        converted_schema[table_name] = {
            "columns": []
        }
        
        # Process columns
        for column in table_info.get('columns', []):
            # Convert constraints from string to list
            constraints = column.get('constraints', '')
            if isinstance(constraints, str):
                # Split constraints and clean them up
                constraint_list = []
                if constraints.strip():
                    # Simple parsing of common constraints
                    constraints_upper = constraints.upper()
                    if 'PRIMARY KEY' in constraints_upper:
                        constraint_list.append('PRIMARY KEY')
                    if 'NOT NULL' in constraints_upper:
                        constraint_list.append('NOT NULL')
                    if 'UNIQUE' in constraints_upper:
                        constraint_list.append('UNIQUE')
                    if 'AUTO_INCREMENT' in constraints_upper or 'AUTOINCREMENT' in constraints_upper:
                        constraint_list.append('AUTO_INCREMENT')
                    if 'FOREIGN KEY' in constraints_upper:
                        constraint_list.append('FOREIGN KEY')
            elif isinstance(constraints, list):
                constraint_list = constraints
            else:
                constraint_list = []
            
            converted_schema[table_name]["columns"].append({
                "name": column.get('name', ''),
                "type": column.get('type', ''),
                "constraints": constraint_list
            })
    
    return converted_schema

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

            # Generate warehouse schema using AI (one fact table + dimensions)
            warehouse_schema = generate_warehouse_schema_with_ai(schema_details, domain)

            # Process warehouse_schema to add pk_columns and fk_columns if it's valid
            if isinstance(warehouse_schema, dict):
                for table_name, table_info in warehouse_schema.items():
                    if isinstance(table_info, dict):
                        columns = table_info.get('columns', [])
                        pk_columns = set()
                        fk_columns = set()
                        
                        if isinstance(columns, list):
                            for column in columns:
                                if isinstance(column, dict):
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

            # Generate full detailed AI warehouse schema (comprehensive enterprise schema)
            ai_enhanced_schema = generate_full_detailed_ai_warehouse(schema_details, domain)

            # Validate the AI enhanced schema structure
            if not validate_schema_structure(ai_enhanced_schema, "ai_enhanced_schema"):
                print("AI enhanced schema validation failed, setting empty schema")
                ai_enhanced_schema = {}

            # Process ai_enhanced_schema (now one fact table + multiple dimension tables) to add pk_columns and fk_columns if possible
            # Add validation to ensure ai_enhanced_schema is properly formatted
            if isinstance(ai_enhanced_schema, dict):
                for table_name, table_info in ai_enhanced_schema.items():
                    # Validate that table_info is a dictionary
                    if not isinstance(table_info, dict):
                        print(f"Warning: table_info for {table_name} is not a dictionary: {type(table_info)}")
                        continue
                    
                    columns = table_info.get('columns', [])
                    pk_columns = set()
                    fk_columns = set()
                    
                    # Validate columns is a list
                    if not isinstance(columns, list):
                        print(f"Warning: columns for {table_name} is not a list: {type(columns)}")
                        continue
                    
                    for column in columns:
                        # Validate column is a dictionary
                        if not isinstance(column, dict):
                            print(f"Warning: column in {table_name} is not a dictionary: {type(column)}")
                            continue
                            
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
            else:
                print(f"Warning: ai_enhanced_schema is not a dictionary: {type(ai_enhanced_schema)}")

            # AI suggestions
            ai_suggestions = suggest_missing_elements(schema_details, domain)

            # Perform comprehensive evaluation
            print("🔬 Starting comprehensive schema evaluation...")
            evaluation_results = evaluation_framework.evaluate_schemas(
                original_schema=convert_schema_format(schema_details),
                warehouse_schema=warehouse_schema,
                ai_enhanced_schema=ai_enhanced_schema,
                domain=domain
            )

            # Update the user_db instance with all processed data
            user_db.original_schema = convert_schema_format(schema_details)
            user_db.warehouse_schema = warehouse_schema
            user_db.ai_enhanced_schema = ai_enhanced_schema
            user_db.evaluation_results = evaluation_results
            user_db.save(update_fields=[
                'original_schema',
                'warehouse_schema',
                'ai_enhanced_schema',
                'evaluation_results',
            ])

            response_data = {
                'message': 'Schema uploaded and processed successfully.',
                'id': user_db.id,
            }
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BaseUserDatabaseAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_user_db(self, pk):
        return get_object_or_404(UserDatabase, pk=pk, user=self.request.user)

class OriginalSchemaAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        if user_db.original_schema:
            # Ensure the schema is in the correct format
            formatted_schema = user_db.original_schema
            if formatted_schema:
                return Response(formatted_schema, status=status.HTTP_200_OK)
        return Response({'error': 'Original schema not found.'}, status=status.HTTP_404_NOT_FOUND)

class WarehouseSchemaAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        if user_db.warehouse_schema:
            return Response(user_db.warehouse_schema, status=status.HTTP_200_OK)
        return Response({'error': 'Warehouse schema not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        updated_schema = request.data.get('schema')
        
        if not updated_schema:
            return Response({'error': 'Schema data is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate the updated schema structure
        if not validate_schema_structure(updated_schema, "updated_warehouse_schema"):
            return Response({'error': 'Invalid schema structure.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Process the updated schema to add pk_columns and fk_columns
        for table_name, table_info in updated_schema.items():
            if isinstance(table_info, dict):
                columns = table_info.get('columns', [])
                pk_columns = set()
                fk_columns = set()
                
                if isinstance(columns, list):
                    for column in columns:
                        if isinstance(column, dict):
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
        
        # Save the updated schema
        user_db.warehouse_schema = updated_schema
        user_db.save(update_fields=['warehouse_schema'])
        
        return Response({
            'message': 'Warehouse schema updated successfully.',
            'schema': updated_schema
        }, status=status.HTTP_200_OK)

class AIEnhancedSchemaAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        if user_db.ai_enhanced_schema:
            return Response(user_db.ai_enhanced_schema, status=status.HTTP_200_OK)
        return Response({'error': 'AI enhanced schema not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    def put(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        updated_schema = request.data.get('schema')
        
        if not updated_schema:
            return Response({'error': 'Schema data is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate the updated schema structure
        if not validate_schema_structure(updated_schema, "updated_ai_enhanced_schema"):
            return Response({'error': 'Invalid schema structure.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Process the updated schema to add pk_columns and fk_columns
        for table_name, table_info in updated_schema.items():
            if isinstance(table_info, dict):
                columns = table_info.get('columns', [])
                pk_columns = set()
                fk_columns = set()
                
                if isinstance(columns, list):
                    for column in columns:
                        if isinstance(column, dict):
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
        
        # Save the updated schema
        user_db.ai_enhanced_schema = updated_schema
        user_db.save(update_fields=['ai_enhanced_schema'])
        
        return Response({
            'message': 'AI enhanced schema updated successfully.',
            'schema': updated_schema
        }, status=status.HTTP_200_OK)

class MetadataAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        
        # Extract AI suggestions from evaluation results if available
        ai_suggestions = {}
        missing_tables = []
        missing_columns = {}
        
        if user_db.evaluation_results:
            # Check if we have AI suggestions stored in evaluation results
            stored_ai_suggestions = user_db.evaluation_results.get('ai_suggestions', {})
            if stored_ai_suggestions:
                missing_tables = stored_ai_suggestions.get('missing_tables', [])
                missing_columns = stored_ai_suggestions.get('missing_columns', [])
                domain_suggestions = stored_ai_suggestions.get('domain_suggestions', {})
                
                ai_suggestions = {
                    'missing_tables': missing_tables,
                    'missing_columns': missing_columns,
                    'recommendations': domain_suggestions.get('recommendations', f"Based on {user_db.domain} industry best practices, we've created a comprehensive data warehouse design."),
                    'domain_detected': user_db.domain,
                    'warehouse_tables_count': len(user_db.warehouse_schema) if user_db.warehouse_schema else 0,
                    'ai_enhanced_tables_count': len(user_db.ai_enhanced_schema) if user_db.ai_enhanced_schema else 0,
                }
            else:
                # Fallback to recommendations from evaluation results
                recommendations = user_db.evaluation_results.get('recommendations', [])
                ai_suggestions = {
                    'recommendations': recommendations,
                    'domain_detected': user_db.domain,
                    'warehouse_tables_count': len(user_db.warehouse_schema) if user_db.warehouse_schema else 0,
                    'ai_enhanced_tables_count': len(user_db.ai_enhanced_schema) if user_db.ai_enhanced_schema else 0,
                }
        
        metadata = {
            'domain': user_db.domain,
            'ai_suggestions': ai_suggestions,
            'missing_tables': missing_tables,
            'missing_columns': missing_columns,
            'evaluation_results': user_db.evaluation_results,
        }
        return Response(metadata, status=status.HTTP_200_OK)

class EvaluationResultsAPIView(BaseUserDatabaseAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        if user_db.evaluation_results:
            return Response(user_db.evaluation_results, status=status.HTTP_200_OK)
        return Response({'error': 'Evaluation results not found.'}, status=status.HTTP_404_NOT_FOUND)

class ExportSchemaAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_user_db(self, pk):
        return get_object_or_404(UserDatabase, pk=pk, user=self.request.user)
    
    def schema_to_sql(self, schema, schema_name="schema"):
        """Convert schema dictionary to SQL CREATE TABLE statements"""
        if not schema:
            return ""
        
        sql_content = f"-- {schema_name.upper()} SCHEMA\n-- Generated by Warehouse Schema Generator\n\n"
        
        for table_name, table_info in schema.items():
            if not isinstance(table_info, dict) or 'columns' not in table_info:
                continue
                
            sql_content += f"CREATE TABLE {table_name} (\n"
            columns_sql = []
            
            for column in table_info.get('columns', []):
                if not isinstance(column, dict):
                    continue
                    
                column_name = column.get('name', 'unnamed_column')
                column_type = column.get('type', 'VARCHAR(255)')
                constraints = column.get('constraints', [])
                
                column_sql = f"    {column_name} {column_type}"
                
                if constraints:
                    if isinstance(constraints, list):
                        constraint_str = " ".join(constraints)
                    else:
                        constraint_str = str(constraints)
                    column_sql += f" {constraint_str}"
                
                columns_sql.append(column_sql)
            
            sql_content += ",\n".join(columns_sql)
            sql_content += "\n);\n\n"
        
        return sql_content
    
    def create_response(self, content, filename, content_type):
        """Create HTTP response for file download"""
        response = HttpResponse(content, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

class ExportOriginalSchemaAPIView(ExportSchemaAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        export_format = request.query_params.get('format', 'sql').lower()
        
        if not user_db.original_schema:
            return Response({'error': 'Original schema not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if export_format == 'sql':
            content = self.schema_to_sql(user_db.original_schema, "Original")
            return self.create_response(content, f"original_schema_{pk}.sql", "text/plain")
        elif export_format == 'json':
            content = json.dumps(user_db.original_schema, indent=2)
            return self.create_response(content, f"original_schema_{pk}.json", "application/json")
        else:
            return Response({'error': 'Invalid format. Use sql or json.'}, status=status.HTTP_400_BAD_REQUEST)

class ExportWarehouseSchemaAPIView(ExportSchemaAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        export_format = request.query_params.get('format', 'sql').lower()
        
        if not user_db.warehouse_schema:
            return Response({'error': 'Warehouse schema not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if export_format == 'sql':
            content = self.schema_to_sql(user_db.warehouse_schema, "Warehouse")
            return self.create_response(content, f"warehouse_schema_{pk}.sql", "text/plain")
        elif export_format == 'json':
            content = json.dumps(user_db.warehouse_schema, indent=2)
            return self.create_response(content, f"warehouse_schema_{pk}.json", "application/json")
        else:
            return Response({'error': 'Invalid format. Use sql or json.'}, status=status.HTTP_400_BAD_REQUEST)

class ExportAIEnhancedSchemaAPIView(ExportSchemaAPIView):
    def get(self, request, pk, format=None):
        user_db = self.get_user_db(pk)
        export_format = request.query_params.get('format', 'sql').lower()
        
        if not user_db.ai_enhanced_schema:
            return Response({'error': 'AI enhanced schema not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if export_format == 'sql':
            content = self.schema_to_sql(user_db.ai_enhanced_schema, "AI Enhanced")
            return self.create_response(content, f"ai_enhanced_schema_{pk}.sql", "text/plain")
        elif export_format == 'json':
            content = json.dumps(user_db.ai_enhanced_schema, indent=2)
            return self.create_response(content, f"ai_enhanced_schema_{pk}.json", "application/json")
        else:
            return Response({'error': 'Invalid format. Use sql or json.'}, status=status.HTTP_400_BAD_REQUEST)

# Authentication Views
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Dashboard Views
class DashboardView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_databases = UserDatabase.objects.filter(user=request.user)
        
        # Statistics
        total_schemas = user_databases.count()
        domains = user_databases.values_list('domain', flat=True).distinct()
        
        # Recent schemas
        recent_schemas = user_databases[:5]
        recent_serializer = UserDatabaseListSerializer(recent_schemas, many=True)
        
        # Domain distribution
        domain_stats = {}
        for db in user_databases:
            domain_stats[db.domain] = domain_stats.get(db.domain, 0) + 1
        
        # Score statistics
        scores = []
        for db in user_databases:
            summary = db.get_evaluation_summary()
            if summary:
                scores.append({
                    'warehouse_score': summary['warehouse_score'],
                    'ai_enhanced_score': summary['ai_enhanced_score']
                })
        
        avg_warehouse_score = sum(s['warehouse_score'] for s in scores) / len(scores) if scores else 0
        avg_ai_score = sum(s['ai_enhanced_score'] for s in scores) / len(scores) if scores else 0
        
        return Response({
            'statistics': {
                'total_schemas': total_schemas,
                'total_domains': len(domains),
                'avg_warehouse_score': round(avg_warehouse_score, 1),
                'avg_ai_enhanced_score': round(avg_ai_score, 1)
            },
            'domain_distribution': domain_stats,
            'recent_schemas': recent_serializer.data,
            'user': UserSerializer(request.user).data
        })

class UserSchemasView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_databases = UserDatabase.objects.filter(user=request.user)
        
        # Filtering
        domain = request.query_params.get('domain')
        if domain:
            user_databases = user_databases.filter(domain__icontains=domain)
        
        # Pagination
        page_size = int(request.query_params.get('page_size', 10))
        page = int(request.query_params.get('page', 1))
        
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = user_databases.count()
        schemas = user_databases[start:end]
        
        serializer = UserDatabaseListSerializer(schemas, many=True)
        
        return Response({
            'results': serializer.data,
            'total_count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size
        })

class SchemaDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, schema_id):
        try:
            schema = UserDatabase.objects.get(id=schema_id, user=request.user)
            serializer = UserDatabaseSerializer(schema)
            return Response(serializer.data)
        except UserDatabase.DoesNotExist:
            return Response({'error': 'Schema not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request, schema_id):
        try:
            schema = UserDatabase.objects.get(id=schema_id, user=request.user)
            schema.delete()
            return Response({'message': 'Schema deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except UserDatabase.DoesNotExist:
            return Response({'error': 'Schema not found'}, status=status.HTTP_404_NOT_FOUND)

# Protected Schema Generation
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_schema(request):
    """Generate warehouse and AI-enhanced schemas for authenticated users"""
    try:
        # Get the uploaded file
        schema_file = request.FILES.get('schema_file')
        schema_name = request.data.get('schema_name', 'Untitled Schema')
        
        if not schema_file:
            return Response({'error': 'No schema file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse the uploaded schema
        try:
            # Save uploaded file temporarily
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w+', suffix='.sql', delete=False) as temp_file:
                for chunk in schema_file.chunks():
                    temp_file.write(chunk.decode('utf-8'))
                temp_file_path = temp_file.name
            
            # Parse the schema
            schema_details = parse_sql_file(temp_file_path)
            
            # Clean up temp file
            os.unlink(temp_file_path)
            
            # Convert to our schema format
            original_schema = convert_schema_format(schema_details)
        except Exception as e:
            return Response({'error': f'Error parsing schema: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate AI suggestions and enhancements
        try:
            ai_result = generate_ai_suggestions(original_schema)
            warehouse_schema = ai_result['warehouse_schema']
            ai_enhanced_schema = ai_result['ai_enhanced_schema']
            domain = ai_result.get('domain', 'Unknown')
            missing_tables = ai_result.get('missing_tables', [])
            missing_columns = ai_result.get('missing_columns', [])
            ai_suggestions = ai_result.get('suggestions', {})
        except Exception as e:
            return Response({'error': f'Error generating AI suggestions: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Evaluate schemas
        try:
            evaluation_results = evaluate_schemas(original_schema, warehouse_schema, ai_enhanced_schema)
            # Add AI suggestions to evaluation results
            evaluation_results['ai_suggestions'] = {
                'missing_tables': missing_tables,
                'missing_columns': missing_columns,
                'domain_suggestions': ai_suggestions
            }
        except Exception as e:
            print(f"Evaluation error: {e}")
            evaluation_results = {
                'ai_suggestions': {
                    'missing_tables': missing_tables,
                    'missing_columns': missing_columns, 
                    'domain_suggestions': ai_suggestions
                }
            }
        
        # Save to database
        user_database = UserDatabase.objects.create(
            user=request.user,
            schema_name=schema_name,
            original_schema=original_schema,
            warehouse_schema=warehouse_schema,
            ai_enhanced_schema=ai_enhanced_schema,
            domain=domain,
            evaluation_results=evaluation_results
        )
        
        # Return response
        serializer = UserDatabaseSerializer(user_database)
        return Response({
            'message': 'Schema generated successfully',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Legacy views for backward compatibility
@csrf_exempt
@require_http_methods(["POST"])
def upload_schema(request):
    """Legacy upload endpoint - redirects to protected endpoint"""
    return JsonResponse({
        'error': 'Authentication required. Please use the /api/auth/generate-schema/ endpoint with a valid token.'
    }, status=401)

def schema_result(request, db_id):
    """Legacy result view - now requires authentication"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    try:
        user_db = get_object_or_404(UserDatabase, id=db_id, user=request.user)
        context = {
            'user_db': user_db,
            'original_schema': user_db.original_schema,
            'warehouse_schema': user_db.warehouse_schema,
            'ai_enhanced_schema': user_db.ai_enhanced_schema,
            'evaluation_results': user_db.evaluation_results,
        }
        return render(request, 'schema_generator/schema_result.html', context)
    except UserDatabase.DoesNotExist:
        return JsonResponse({'error': 'Schema not found'}, status=404)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_schema_view(request):
    """Update warehouse or AI enhanced schema for authenticated users"""
    try:
        schema_id = request.data.get('schema_id')
        schema_type = request.data.get('schema_type')  # 'warehouse' or 'ai_enhanced'
        updated_schema = request.data.get('schema')
        
        if not all([schema_id, schema_type, updated_schema]):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_database = UserDatabase.objects.get(id=schema_id, user=request.user)
        except UserDatabase.DoesNotExist:
            return Response({'error': 'Schema not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validate schema structure
        if not validate_schema_structure(updated_schema, f"updated_{schema_type}_schema"):
            return Response({'error': 'Invalid schema structure'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Process the schema to add metadata
        for table_name, table_info in updated_schema.items():
            if isinstance(table_info, dict):
                columns = table_info.get('columns', [])
                pk_columns = set()
                fk_columns = set()
                
                if isinstance(columns, list):
                    for column in columns:
                        if isinstance(column, dict):
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
        
        # Update the appropriate schema
        if schema_type == 'warehouse':
            user_database.warehouse_schema = updated_schema
            user_database.save(update_fields=['warehouse_schema'])
        elif schema_type == 'ai_enhanced':
            user_database.ai_enhanced_schema = updated_schema
            user_database.save(update_fields=['ai_enhanced_schema'])
        else:
            return Response({'error': 'Invalid schema type'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'message': f'{schema_type.title()} schema updated successfully',
            'schema': updated_schema
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_schema(request, db_id, schema_type, format):
    """Export schema in various formats for authenticated users"""
    try:
        # Get the user's database
        try:
            user_db = UserDatabase.objects.get(id=db_id, user=request.user)
        except UserDatabase.DoesNotExist:
            return Response({'error': 'Schema not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get the appropriate schema
        if schema_type == 'original':
            schema = user_db.original_schema
        elif schema_type == 'warehouse':
            schema = user_db.warehouse_schema
        elif schema_type == 'ai_enhanced':
            schema = user_db.ai_enhanced_schema
        else:
            return Response({'error': 'Invalid schema type'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not schema:
            return Response({'error': f'{schema_type} schema not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate content based on format
        if format == 'sql':
            content = schema_to_sql(schema, f"{schema_type}_schema")
            content_type = 'text/plain'
            file_extension = 'sql'
        elif format == 'json':
            content = json.dumps(schema, indent=2)
            content_type = 'application/json'
            file_extension = 'json'
        else:
            return Response({'error': 'Invalid format. Use sql or json.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create response
        response = HttpResponse(content, content_type=content_type)
        filename = f"{user_db.schema_name}_{schema_type}_schema.{file_extension}"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
        
    except Exception as e:
        return Response({'error': f'Export failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def schema_to_sql(schema, schema_name="schema"):
    """Convert schema dictionary to SQL CREATE TABLE statements"""
    if not schema:
        return ""
    
    sql_content = f"-- {schema_name.upper()} SCHEMA\n-- Generated by Warehouse Schema Generator\n\n"
    
    for table_name, table_info in schema.items():
        if not isinstance(table_info, dict) or 'columns' not in table_info:
            continue
            
        sql_content += f"CREATE TABLE {table_name} (\n"
        columns_sql = []
        
        for column in table_info.get('columns', []):
            if not isinstance(column, dict):
                continue
                
            column_name = column.get('name', '')
            column_type = column.get('type', 'VARCHAR(255)')
            constraints = column.get('constraints', [])
            
            if isinstance(constraints, list):
                constraints_str = ' '.join(str(c) for c in constraints)
            else:
                constraints_str = str(constraints) if constraints else ''
            
            column_sql = f"    {column_name} {column_type}"
            if constraints_str:
                column_sql += f" {constraints_str}"
            
            columns_sql.append(column_sql)
        
        sql_content += ',\n'.join(columns_sql)
        sql_content += "\n);\n\n"
    
    return sql_content
