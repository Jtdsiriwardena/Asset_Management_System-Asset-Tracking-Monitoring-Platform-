from rest_framework import serializers
from .models import Notification, NotificationPreference
from accounts.serializers import UserSerializer

class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for notifications
    """
    recipient_details = UserSerializer(source='recipient', read_only=True)
    sender_details = UserSerializer(source='sender', read_only=True)
    time_ago = serializers.SerializerMethodField()
    object_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'recipient_details', 'sender', 'sender_details',
            'notification_type', 'title', 'message', 'data',
            'is_read', 'created_at', 'read_at', 'time_ago', 'object_url'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
    
    def get_time_ago(self, obj):
        """Get human readable time ago"""
        from django.utils import timezone
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds >= 3600:
            return f"{diff.seconds // 3600}h ago"
        elif diff.seconds >= 60:
            return f"{diff.seconds // 60}m ago"
        else:
            return "Just now"
    
    def get_object_url(self, obj):
        """Get URL for the related object"""
        if not obj.content_object:
            return None
        
        # Map content types to frontend URLs
        url_map = {
            'asset': f"/assets/{obj.object_id}",
            'assignment': f"/assignments/{obj.object_id}",
        }
        
        content_type = obj.content_type.model
        return url_map.get(content_type)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for notification preferences
    """
    class Meta:
        model = NotificationPreference
        exclude = ['user']


class NotificationMarkReadSerializer(serializers.Serializer):
    """
    Serializer for marking notifications as read
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    all = serializers.BooleanField(default=False)


class NotificationCountSerializer(serializers.Serializer):
    """
    Serializer for notification counts
    """
    total = serializers.IntegerField()
    unread = serializers.IntegerField()
    read = serializers.IntegerField()