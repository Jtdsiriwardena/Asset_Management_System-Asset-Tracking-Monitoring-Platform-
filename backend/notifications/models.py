from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
import json

User = get_user_model()

class Notification(models.Model):
    """
    Notification model for in-app notifications
    """
    
    class NotificationType(models.TextChoices):
        # Assignment notifications
        ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED', 'New Assignment'
        ASSIGNMENT_UPDATED = 'ASSIGNMENT_UPDATED', 'Assignment Updated'
        RETURN_REQUESTED = 'RETURN_REQUESTED', 'Return Requested'
        RETURN_APPROVED = 'RETURN_APPROVED', 'Return Approved'
        RETURN_REJECTED = 'RETURN_REJECTED', 'Return Rejected'
        DAMAGE_REPORTED = 'DAMAGE_REPORTED', 'Damage Reported'
        ASSIGNMENT_OVERDUE = 'ASSIGNMENT_OVERDUE', 'Assignment Overdue'
        
        # Asset notifications
        ASSET_CREATED = 'ASSET_CREATED', 'New Asset'
        ASSET_UPDATED = 'ASSET_UPDATED', 'Asset Updated'
        ASSET_DELETED = 'ASSET_DELETED', 'Asset Deleted'
        WARRANTY_EXPIRING = 'WARRANTY_EXPIRING', 'Warranty Expiring'
        
        # General notifications
        SYSTEM_ALERT = 'SYSTEM_ALERT', 'System Alert'
        MAINTENANCE = 'MAINTENANCE', 'Maintenance'
        INFO = 'INFO', 'Information'
    
    # Recipient
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    # Sender (optional)
    sender = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_notifications'
    )
    
    # Notification content
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related object (optional)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Metadata
    data = models.JSONField(default=dict, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(default=timezone.now)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]
    
    def __str__(self):
        return f"{self.recipient.username} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def mark_as_unread(self):
        """Mark notification as unread"""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            self.save(update_fields=['is_read', 'read_at'])
    
    @classmethod
    def create_notification(cls, recipient, notification_type, title, message, 
                           sender=None, content_object=None, data=None):
        """Create a new notification"""
        notification = cls.objects.create(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            title=title,
            message=message,
            content_type=ContentType.objects.get_for_model(content_object) if content_object else None,
            object_id=content_object.id if content_object else None,
            data=data or {}
        )
        return notification


class NotificationPreference(models.Model):
    """
    User preferences for notifications
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Email preferences
    email_notifications = models.BooleanField(default=True)
    email_on_assignment = models.BooleanField(default=True)
    email_on_return = models.BooleanField(default=True)
    email_on_warranty = models.BooleanField(default=True)
    
    # In-app preferences
    in_app_notifications = models.BooleanField(default=True)
    sound_enabled = models.BooleanField(default=True)
    desktop_notifications = models.BooleanField(default=False)
    
    # Digest preferences
    digest_frequency = models.CharField(
        max_length=20,
        choices=[
            ('instant', 'Instant'),
            ('hourly', 'Hourly'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
        ],
        default='instant'
    )
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Preferences for {self.user.username}"