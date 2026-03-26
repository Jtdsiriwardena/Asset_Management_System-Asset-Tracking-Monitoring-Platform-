from datetime import timezone

from django.contrib.contenttypes.models import ContentType
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification, NotificationPreference
from accounts.models import User
import json

class NotificationService:
    """
    Service class for creating and sending notifications
    """
    
    @classmethod
    def send_notification(cls, recipient, notification_type, title, message,
                          sender=None, content_object=None, data=None):
        """
        Create and send a notification to a user
        """
        # Check if user wants this type of notification
        prefs, _ = NotificationPreference.objects.get_or_create(user=recipient)
        
        if not prefs.in_app_notifications:
            return None
        
        # Create notification in database
        notification = Notification.create_notification(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            title=title,
            message=message,
            content_object=content_object,
            data=data
        )
        
        # Send real-time notification via WebSocket
        cls._send_websocket_notification(recipient, notification)
        
        # Send desktop notification if enabled
        if prefs.desktop_notifications:
            cls._send_desktop_notification(recipient, notification)
        
        return notification
    
    @classmethod
    def send_bulk_notification(cls, recipients, notification_type, title, message,
                               sender=None, content_object=None, data=None):
        """
        Send notification to multiple users
        """
        notifications = []
        for recipient in recipients:
            notif = cls.send_notification(
                recipient=recipient,
                notification_type=notification_type,
                title=title,
                message=message,
                sender=sender,
                content_object=content_object,
                data=data
            )
            if notif:
                notifications.append(notif)
        
        return notifications
    
    @classmethod
    def notify_admins(cls, notification_type, title, message,
                      sender=None, content_object=None, data=None):
        """
        Send notification to all admin users
        """
        admins = User.objects.filter(role='ADMIN', is_active=True)
        return cls.send_bulk_notification(
            recipients=admins,
            notification_type=notification_type,
            title=title,
            message=message,
            sender=sender,
            content_object=content_object,
            data=data
        )
    
    @classmethod
    def _send_websocket_notification(cls, recipient, notification):
        """
        Send real-time notification via WebSocket
        """
        from .serializers import NotificationSerializer
        
        channel_layer = get_channel_layer()
        serializer = NotificationSerializer(notification)
        
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}_notifications",
            {
                'type': 'send_notification',
                'notification': serializer.data
            }
        )
    
    @classmethod
    def _send_desktop_notification(cls, recipient, notification):
        """
        Send desktop push notification (implement with your push service)
        """
        # This would integrate with a push notification service
        pass
    
    # ========== ASSIGNMENT NOTIFICATIONS ==========
    
    @classmethod
    def notify_assignment_created(cls, assignment):
        """Notify employee when asset is assigned to them"""
        return cls.send_notification(
            recipient=assignment.assigned_to,
            notification_type=Notification.NotificationType.ASSIGNMENT_CREATED,
            title="New Asset Assigned",
            message=f"Asset '{assignment.asset.name}' has been assigned to you.",
            sender=assignment.assigned_by,
            content_object=assignment,
            data={
                'asset_id': assignment.asset.id,
                'asset_name': assignment.asset.name,
                'assignment_id': assignment.id
            }
        )
    
    @classmethod
    def notify_return_requested(cls, assignment):
        """Notify admins when employee requests return"""
        return cls.notify_admins(
            notification_type=Notification.NotificationType.RETURN_REQUESTED,
            title="Return Request Received",
            message=f"{assignment.assigned_to.username} requested to return '{assignment.asset.name}'.",
            sender=assignment.assigned_to,
            content_object=assignment,
            data={
                'asset_id': assignment.asset.id,
                'user_id': assignment.assigned_to.id,
                'assignment_id': assignment.id
            }
        )
    
    @classmethod
    def notify_return_approved(cls, assignment):
        """Notify employee when return is approved"""
        return cls.send_notification(
            recipient=assignment.assigned_to,
            notification_type=Notification.NotificationType.RETURN_APPROVED,
            title="Return Request Approved",
            message=f"Your return request for '{assignment.asset.name}' has been approved.",
            sender=assignment.approved_by,
            content_object=assignment,
            data={
                'asset_id': assignment.asset.id,
                'assignment_id': assignment.id
            }
        )
    
    @classmethod
    def notify_return_rejected(cls, assignment):
        """Notify employee when return is rejected"""
        return cls.send_notification(
            recipient=assignment.assigned_to,
            notification_type=Notification.NotificationType.RETURN_REJECTED,
            title="Return Request Rejected",
            message=f"Your return request for '{assignment.asset.name}' was rejected. Reason: {assignment.rejection_reason}",
            sender=assignment.approved_by,
            content_object=assignment,
            data={
                'asset_id': assignment.asset.id,
                'assignment_id': assignment.id,
                'reason': assignment.rejection_reason
            }
        )
    
    @classmethod
    def notify_damage_reported(cls, assignment):
        """Notify admins when damage is reported"""
        return cls.notify_admins(
            notification_type=Notification.NotificationType.DAMAGE_REPORTED,
            title="Damage Reported",
            message=f"{assignment.assigned_to.username} reported damage to '{assignment.asset.name}'.",
            sender=assignment.assigned_to,
            content_object=assignment,
            data={
                'asset_id': assignment.asset.id,
                'user_id': assignment.assigned_to.id,
                'assignment_id': assignment.id,
                'description': assignment.damage_description
            }
        )
    
    @classmethod
    def notify_assignment_overdue(cls, assignment):
        """Notify employee and admins when assignment is overdue"""
        # Notify employee
        cls.send_notification(
            recipient=assignment.assigned_to,
            notification_type=Notification.NotificationType.ASSIGNMENT_OVERDUE,
            title="Assignment Overdue",
            message=f"Your assignment for '{assignment.asset.name}' is overdue. Please return it as soon as possible.",
            content_object=assignment,
            data={
                'asset_id': assignment.asset.id,
                'assignment_id': assignment.id,
                'due_date': str(assignment.expected_return_date)
            }
        )
        
        # Notify admins
        return cls.notify_admins(
            notification_type=Notification.NotificationType.ASSIGNMENT_OVERDUE,
            title="Overdue Assignment",
            message=f"Assignment for '{assignment.asset.name}' to {assignment.assigned_to.username} is overdue.",
            content_object=assignment,
            data={
                'asset_id': assignment.asset.id,
                'user_id': assignment.assigned_to.id,
                'assignment_id': assignment.id,
                'due_date': str(assignment.expected_return_date)
            }
        )
    
    # ========== ASSET NOTIFICATIONS ==========
    
    @classmethod
    def notify_asset_created(cls, asset, created_by):
        """Notify admins when new asset is created"""
        return cls.notify_admins(
            notification_type=Notification.NotificationType.ASSET_CREATED,
            title="New Asset Added",
            message=f"New asset '{asset.name}' has been added to inventory.",
            sender=created_by,
            content_object=asset,
            data={
                'asset_id': asset.id,
                'asset_code': asset.asset_code
            }
        )
    
    @classmethod
    def notify_asset_updated(cls, asset, updated_by):
        """Notify admins when asset is updated"""
        return cls.notify_admins(
            notification_type=Notification.NotificationType.ASSET_UPDATED,
            title="Asset Updated",
            message=f"Asset '{asset.name}' has been updated.",
            sender=updated_by,
            content_object=asset,
            data={
                'asset_id': asset.id,
                'asset_code': asset.asset_code
            }
        )
    
    @classmethod
    def notify_warranty_expiring(cls, asset):
        """Notify admins when warranty is expiring soon"""
        days_left = (asset.warranty_expiry - timezone.now().date()).days
        
        return cls.notify_admins(
            notification_type=Notification.NotificationType.WARRANTY_EXPIRING,
            title="Warranty Expiring Soon",
            message=f"Warranty for '{asset.name}' expires in {days_left} days.",
            content_object=asset,
            data={
                'asset_id': asset.id,
                'asset_code': asset.asset_code,
                'days_left': days_left,
                'expiry_date': str(asset.warranty_expiry)
            }
        )