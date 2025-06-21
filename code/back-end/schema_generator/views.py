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
            user_db.ai_suggestions = ai_suggestions
            user_db.missing_tables = ai_suggestions.get('missing_tables', [])
            user_db.missing_columns = ai_suggestions.get('missing_columns', [])
            user_db.evaluation_results = evaluation_results
            user_db.save(update_fields=[
                'original_schema',
                'warehouse_schema',
                'ai_enhanced_schema',
                'ai_suggestions',
                'missing_tables',
                'missing_columns',
                'evaluation_results',
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
        metadata = {
            'domain': user_db.domain,
            'ai_suggestions': user_db.ai_suggestions,
            'missing_tables': user_db.missing_tables,
            'missing_columns': user_db.missing_columns,
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
    def get_user_db(self, pk):
        return get_object_or_404(UserDatabase, pk=pk)
    
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
