# schema_generator/urls.py

from django.urls import path
from .views import (
    UploadSchemaAPIView,
    OriginalSchemaAPIView,
    WarehouseSchemaAPIView,
    AIEnhancedSchemaAPIView,
    MetadataAPIView,
    ExportOriginalSchemaAPIView,
    ExportWarehouseSchemaAPIView,
    ExportAIEnhancedSchemaAPIView,
)

urlpatterns = [
    path('upload/', UploadSchemaAPIView.as_view(), name='upload_schema_api'),
    path('original_schema/<int:pk>/', OriginalSchemaAPIView.as_view(), name='original_schema_api'),
    path('warehouse_schema/<int:pk>/', WarehouseSchemaAPIView.as_view(), name='warehouse_schema_api'),
    path('ai_enhanced_schema/<int:pk>/', AIEnhancedSchemaAPIView.as_view(), name='ai_enhanced_schema_api'),
    path('metadata/<int:pk>/', MetadataAPIView.as_view(), name='metadata_api'),
    
    # Export endpoints
    path('export/original/<int:pk>/', ExportOriginalSchemaAPIView.as_view(), name='export_original_schema'),
    path('export/warehouse/<int:pk>/', ExportWarehouseSchemaAPIView.as_view(), name='export_warehouse_schema'),
    path('export/ai_enhanced/<int:pk>/', ExportAIEnhancedSchemaAPIView.as_view(), name='export_ai_enhanced_schema'),
]
