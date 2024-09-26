# views.py

from django.shortcuts import render
from .forms import UploadSchemaForm
from .models import UserDatabase
from .utils.schema_parsing import parse_sql_file
from .utils.schema_generation import generate_warehouse_schema
from .ai_services import (
    detect_domain_with_ai,
    suggest_missing_elements,
    generate_enhanced_schema_with_ai
)
import os

def upload_schema(request):
    if request.method == 'POST':
        form = UploadSchemaForm(request.POST, request.FILES)
        if form.is_valid():
            user_db = form.save()
            schema_details = parse_sql_file(user_db.schema_file.path)

            domain = form.cleaned_data.get('domain')
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
                    table_info['pk_columns'] = pk_columns

                    # Extract foreign key columns
                    fk_columns = set(fk['column'] for fk in table_info.get('foreign_keys', []))
                    table_info['fk_columns'] = fk_columns

            # Use AI to generate the enhanced schema
            ai_enhanced_schema = generate_enhanced_schema_with_ai(schema_details, domain)

            # Process ai_enhanced_schema to add pk_columns and fk_columns if possible
            for table_name, table_info in ai_enhanced_schema.items():
                columns = table_info.get('columns', [])
                # Initialize pk_columns and fk_columns as empty sets
                pk_columns = set()
                fk_columns = set()
                # If AI provides constraints, process them
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
                table_info['pk_columns'] = pk_columns
                table_info['fk_columns'] = fk_columns

            ai_suggestions = suggest_missing_elements(schema_details, domain)

            context = {
                'original_schema': schema_details,
                'warehouse_schema': warehouse_schema,
                'ai_enhanced_schema': ai_enhanced_schema,
                'domain': domain,
                'ai_suggestions': ai_suggestions,
                'missing_tables': missing_tables,
                'missing_columns': missing_columns,
            }
            return render(request, 'schema_generator/schema_result.html', context)
        else:
            form = UploadSchemaForm()
        return render(request, 'schema_generator/upload_schema.html', {'form': form})
    else:
        form = UploadSchemaForm()
    return render(request, 'schema_generator/upload_schema.html', {'form': form})
