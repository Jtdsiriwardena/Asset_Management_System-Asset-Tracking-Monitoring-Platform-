from rest_framework import serializers
from django.utils import timezone
from .models import Assignment, AssignmentHistory
from assets.serializers import AssetSerializer
from accounts.serializers import UserSerializer


class AssignmentHistorySerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)
    
    class Meta:
        model = AssignmentHistory
        fields = ['id', 'action', 'performed_by', 'performed_by_name', 'timestamp', 'notes']
        read_only_fields = ['id', 'timestamp']

class AssignmentSerializer(serializers.ModelSerializer):
    asset_details = AssetSerializer(source='asset', read_only=True)
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Assignment
        fields = [
            'id', 'asset', 'asset_details', 'assigned_to', 'assigned_to_details',
            'assigned_by', 'assigned_by_name', 'status', 'assigned_date',
            'expected_return_date', 'actual_return_date', 'notes', 'return_notes',
            'damage_description', 'condition_before', 'condition_after',
            'requested_return_date', 'approved_by', 'approved_by_name',
            'approved_date', 'rejection_reason', 'is_overdue', 'duration_days',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'assigned_date', 'actual_return_date', 'requested_return_date',
            'approved_date', 'created_at', 'updated_at', 'status'
        ]

class AssignmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new assignments"""
    
    class Meta:
        model = Assignment
        fields = [
            'asset', 'assigned_to', 'expected_return_date', 
            'notes', 'condition_before'
        ]
    
    def validate_expected_return_date(self, value):
        """Validate return date is in the future"""
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Expected return date must be in the future")
        return value
    
    def validate(self, data):
        """Validate assignment data"""
        asset = data.get('asset')
        assigned_to = data.get('assigned_to')
        
        # Check if asset is available
        if asset and asset.status != 'AVAILABLE':
            raise serializers.ValidationError(
                f"Asset is not available for assignment. Current status: {asset.status}"
            )
        
        # Check if user already has this asset assigned
        if asset and assigned_to:
            existing = Assignment.objects.filter(
                asset=asset,
                assigned_to=assigned_to,
                status__in=['ACTIVE', 'RETURN_REQUESTED']
            ).exists()
            if existing:
                raise serializers.ValidationError(
                    "This asset is already assigned to this user"
                )
        
        return data

class ReturnRequestSerializer(serializers.Serializer):
    """Serializer for return requests"""
    notes = serializers.CharField(required=False, allow_blank=True)
    condition = serializers.CharField(required=False, allow_blank=True)

class DamageReportSerializer(serializers.Serializer):
    """Serializer for damage reports"""
    description = serializers.CharField(required=True)
    notes = serializers.CharField(required=False, allow_blank=True)

class ReturnApprovalSerializer(serializers.Serializer):
    """Serializer for return approval"""
    condition = serializers.CharField(required=False, allow_blank=True)
    approve = serializers.BooleanField(default=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)

class AssignmentStatsSerializer(serializers.Serializer):
    """Serializer for assignment statistics"""
    total_active = serializers.IntegerField()
    total_overdue = serializers.IntegerField()
    pending_returns = serializers.IntegerField()
    total_returned = serializers.IntegerField()
    damaged_reported = serializers.IntegerField()
    recent_assignments = AssignmentSerializer(many=True)