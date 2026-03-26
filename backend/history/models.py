from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import json

User = get_user_model()

class AuditLog(models.Model):
    """
    Centralized audit log for all system actions
    Uses GenericForeignKey to link to any model
    """
    
    class ActionType(models.TextChoices):
        # Asset actions
        ASSET_CREATED = 'ASSET_CREATED', 'Asset Created'
        ASSET_UPDATED = 'ASSET_UPDATED', 'Asset Updated'
        ASSET_DELETED = 'ASSET_DELETED', 'Asset Deleted (Soft)'
        ASSET_PERMANENT_DELETED = 'ASSET_PERMANENT_DELETED', 'Asset Permanently Deleted'
        ASSET_RESTORED = 'ASSET_RESTORED', 'Asset Restored'
        ASSET_STATUS_CHANGED = 'ASSET_STATUS_CHANGED', 'Asset Status Changed'
        
        # Assignment actions
        ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED', 'Assignment Created'
        ASSIGNMENT_UPDATED = 'ASSIGNMENT_UPDATED', 'Assignment Updated'
        ASSIGNMENT_DELETED = 'ASSIGNMENT_DELETED', 'Assignment Deleted'
        ASSIGNMENT_RETURN_REQUESTED = 'ASSIGNMENT_RETURN_REQUESTED', 'Return Requested'
        ASSIGNMENT_RETURN_APPROVED = 'ASSIGNMENT_RETURN_APPROVED', 'Return Approved'
        ASSIGNMENT_RETURN_REJECTED = 'ASSIGNMENT_RETURN_REJECTED', 'Return Rejected'
        ASSIGNMENT_COMPLETED = 'ASSIGNMENT_COMPLETED', 'Assignment Completed'
        ASSIGNMENT_DAMAGE_REPORTED = 'ASSIGNMENT_DAMAGE_REPORTED', 'Damage Reported'
        ASSIGNMENT_OVERDUE = 'ASSIGNMENT_OVERDUE', 'Assignment Overdue'
        
        # User actions
        USER_CREATED = 'USER_CREATED', 'User Created'
        USER_UPDATED = 'USER_UPDATED', 'User Updated'
        USER_LOGIN = 'USER_LOGIN', 'User Login'
        USER_LOGOUT = 'USER_LOGOUT', 'User Logout'
        USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED', 'Password Changed'
        USER_ROLE_CHANGED = 'USER_ROLE_CHANGED', 'User Role Changed'
        
        # Category actions
        CATEGORY_CREATED = 'CATEGORY_CREATED', 'Category Created'
        CATEGORY_UPDATED = 'CATEGORY_UPDATED', 'Category Updated'
        CATEGORY_DELETED = 'CATEGORY_DELETED', 'Category Deleted'
        
        # QR Code actions
        QR_GENERATED = 'QR_GENERATED', 'QR Code Generated'
        QR_REGENERATED = 'QR_REGENERATED', 'QR Code Regenerated'
        QR_SCANNED = 'QR_SCANNED', 'QR Code Scanned'
        QR_DOWNLOADED = 'QR_DOWNLOADED', 'QR Code Downloaded'
        
        # Bulk operations
        BULK_ASSET_DELETE = 'BULK_ASSET_DELETE', 'Bulk Asset Delete'
        BULK_ASSET_RESTORE = 'BULK_ASSET_RESTORE', 'Bulk Asset Restore'
        BULK_QR_GENERATE = 'BULK_QR_GENERATE', 'Bulk QR Generate'
        BULK_ASSIGNMENT = 'BULK_ASSIGNMENT', 'Bulk Assignment'
        
        # System actions
        SYSTEM_ERROR = 'SYSTEM_ERROR', 'System Error'
        DATA_EXPORT = 'DATA_EXPORT', 'Data Export'
        DATA_IMPORT = 'DATA_IMPORT', 'Data Import'
        BACKUP_CREATED = 'BACKUP_CREATED', 'Backup Created'
    
    # Who performed the action
    user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    user_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # What action was performed
    action = models.CharField(max_length=50, choices=ActionType.choices)
    description = models.TextField()
    
    # What object was affected (Generic FK)
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Store object representation for reference
    object_repr = models.CharField(max_length=255, blank=True)
    
    # Store changes (JSON format)
    changes = models.JSONField(default=dict, blank=True)
    
    # Additional metadata
    status = models.CharField(max_length=50, blank=True)
    severity = models.CharField(
        max_length=20,
        choices=[
            ('INFO', 'Info'),
            ('WARNING', 'Warning'),
            ('ERROR', 'Error'),
            ('CRITICAL', 'Critical'),
        ],
        default='INFO'
    )
    
    # Timestamp
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['action']),
            models.Index(fields=['user']),
            models.Index(fields=['content_type', 'object_id']),
        ]
        verbose_name_plural = "Audit logs"
    
    def __str__(self):
        return f"{self.timestamp} - {self.action} - {self.user}"
    
    def save(self, *args, **kwargs):
        # Auto-set object representation if content object exists
        if self.content_object and not self.object_repr:
            try:
                self.object_repr = str(self.content_object)
            except:
                self.object_repr = f"{self.content_type.model}:{self.object_id}"
        super().save(*args, **kwargs)


class AuditLogDetail(models.Model):
    """
    Additional details for audit logs (for large changes)
    """
    audit_log = models.OneToOneField(
        AuditLog,
        on_delete=models.CASCADE,
        related_name='detail'
    )
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']


class ActivityFeed(models.Model):
    """
    User-specific activity feed items
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activity_feed'
    )
    audit_log = models.ForeignKey(
        AuditLog,
        on_delete=models.CASCADE,
        related_name='feed_items'
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['-created_at']),
        ]
    
    def mark_as_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save()


class DataRetentionPolicy(models.Model):
    """
    Configure how long to keep audit logs
    """
    action_type = models.CharField(max_length=50, choices=AuditLog.ActionType.choices)
    retention_days = models.IntegerField(default=365)
    auto_delete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['action_type']
        ordering = ['action_type']
    
    def __str__(self):
        return f"{self.action_type} - {self.retention_days} days"