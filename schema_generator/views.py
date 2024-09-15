from django.shortcuts import render, redirect
from .forms import UploadSchemaForm
from .models import UserDatabase
from .utils import parse_sql_file, generate_warehouse_schema

# schema_generator/views.py

# schema_generator/views.py

def upload_schema(request):
    if request.method == 'POST':
        form = UploadSchemaForm(request.POST, request.FILES)
        if form.is_valid():
            user_db = form.save()
            schema_details = parse_sql_file(user_db.schema_file.path)
            warehouse_schema = generate_warehouse_schema(schema_details)

            return render(request, 'schema_generator/schema_result.html', {'schema': warehouse_schema})
    else:
        form = UploadSchemaForm()
    return render(request, 'schema_generator/upload_schema.html', {'form': form})

