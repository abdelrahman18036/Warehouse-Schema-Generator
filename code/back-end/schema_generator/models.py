from django.db import models
from django.contrib.auth.models import AbstractUser
import json

class User(AbstractUser):
    """Extended User model for authentication"""
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

class UserDatabase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='databases')
    original_schema = models.JSONField()
    warehouse_schema = models.JSONField()
    ai_enhanced_schema = models.JSONField()
    domain = models.CharField(max_length=100)
    schema_name = models.CharField(max_length=255, default="Untitled Schema")
    evaluation_results = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.schema_name} ({self.domain})"
    
    def get_evaluation_summary(self):
        """Get a summary of evaluation results"""
        if not self.evaluation_results:
            return None
        
        try:
            return {
                'warehouse_score': self.evaluation_results.get('warehouse_schema_evaluation', {}).get('overall_score', 0),
                'ai_enhanced_score': self.evaluation_results.get('ai_enhanced_schema_evaluation', {}).get('overall_score', 0),
                'best_schema': self.evaluation_results.get('best_schema_recommendation', {}).get('schema_type', 'unknown'),
                'domain': self.domain,
                'created_at': self.created_at.isoformat()
            }
        except Exception:
            return None
