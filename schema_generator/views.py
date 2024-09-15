from django.shortcuts import render
from .forms import UploadSchemaForm
from .models import UserDatabase
from .utils.schema_parsing import parse_sql_file
from .utils.domain_detection import detect_domain
from .utils.schema_generation import generate_warehouse_schema

def upload_schema(request):
    if request.method == 'POST':
        form = UploadSchemaForm(request.POST, request.FILES)
        if form.is_valid():
            user_db = form.save()
            schema_details = parse_sql_file(user_db.schema_file.path)
            domain = form.cleaned_data.get('domain')
            if not domain or domain == 'Auto-detect':
                domain = detect_domain(schema_details)
                user_db.domain = domain
                user_db.save(update_fields=['domain'])

            # Generate warehouse schema and get missing elements
            warehouse_schema, missing_tables, missing_columns = generate_warehouse_schema(schema_details, domain)

            context = {
                'schema': warehouse_schema,
                'domain': domain,
                'missing_tables': missing_tables,
                'missing_columns': missing_columns,
            }
            return render(request, 'schema_generator/schema_result.html', context)
    else:
        form = UploadSchemaForm()
    return render(request, 'schema_generator/upload_schema.html', {'form': form})
