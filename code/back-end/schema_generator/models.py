from django.db import models

class UserDatabase(models.Model):
    schema_file = models.FileField(upload_to='schemas/')
    domain = models.CharField(max_length=255, blank=True, null=True)
    original_schema = models.JSONField(blank=True, null=True)
    warehouse_schema = models.JSONField(blank=True, null=True)
    ai_enhanced_schema = models.JSONField(blank=True, null=True)
    ai_suggestions = models.JSONField(blank=True, null=True)
    missing_tables = models.JSONField(blank=True, null=True)
    missing_columns = models.JSONField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"UserDatabase {self.id} uploaded at {self.uploaded_at}"
