from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog, AuditLogDetail, ActivityFeed, DataRetentionPolicy
from accounts.serializers import UserSerializer

class AuditLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_details', 'user_ip', 'user_agent',
            'action', 'description', 'content_type', 'content_type_name',
            'object_id', 'object_repr', 'changes', 'status', 'severity',
            'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

class AuditLogDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLogDetail
        fields = ['id', 'audit_log', 'data', 'created_at']

class ActivityFeedSerializer(serializers.ModelSerializer):
    audit_log_details = AuditLogSerializer(source='audit_log', read_only=True)
    
    class Meta:
        model = ActivityFeed
        fields = ['id', 'user', 'audit_log', 'audit_log_details', 'is_read', 'read_at', 'created_at']

class DataRetentionPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = DataRetentionPolicy
        fields = ['id', 'action_type', 'retention_days', 'auto_delete', 'created_at', 'updated_at']

class AuditLogSummarySerializer(serializers.Serializer):
    """Summary statistics for audit logs"""
    total_logs = serializers.IntegerField()
    logs_by_action = serializers.DictField()
    logs_by_user = serializers.DictField()
    logs_by_severity = serializers.DictField()
    recent_activity = AuditLogSerializer(many=True)
    top_users = serializers.ListField()