# schema_generator/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Protected schema generation
    path('auth/generate-schema/', views.generate_schema, name='generate_schema'),
    
    # Dashboard endpoints
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('dashboard/schemas/', views.UserSchemasView.as_view(), name='user_schemas'),
    path('dashboard/schemas/<int:schema_id>/', views.SchemaDetailView.as_view(), name='schema_detail'),
    
    # Individual schema API endpoints
    path('original_schema/<int:pk>/', views.OriginalSchemaAPIView.as_view(), name='original_schema_api'),
    path('warehouse_schema/<int:pk>/', views.WarehouseSchemaAPIView.as_view(), name='warehouse_schema_api'),
    path('ai_enhanced_schema/<int:pk>/', views.AIEnhancedSchemaAPIView.as_view(), name='ai_enhanced_schema_api'),
    path('metadata/<int:pk>/', views.MetadataAPIView.as_view(), name='metadata_api'),
    path('evaluation/<int:pk>/', views.EvaluationResultsAPIView.as_view(), name='evaluation_api'),
    
    # Export endpoints
    path('export/original/<int:pk>/', views.ExportOriginalSchemaAPIView.as_view(), name='export_original'),
    path('export/warehouse/<int:pk>/', views.ExportWarehouseSchemaAPIView.as_view(), name='export_warehouse'),
    path('export/ai_enhanced/<int:pk>/', views.ExportAIEnhancedSchemaAPIView.as_view(), name='export_ai_enhanced'),
    
    # Legacy endpoints (for backward compatibility)
    path('upload/', views.upload_schema, name='upload_schema'),
    path('result/<int:db_id>/', views.schema_result, name='schema_result'),
    
    # API endpoints
    path('update-schema/', views.update_schema_view, name='update_schema'),
    path('export/<int:db_id>/<str:schema_type>/<str:format>/', views.export_schema, name='export_schema'),
]
