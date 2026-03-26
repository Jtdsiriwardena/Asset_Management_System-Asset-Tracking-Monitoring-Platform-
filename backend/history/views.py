from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog, AuditLogDetail, ActivityFeed, DataRetentionPolicy
from .serializers import (
    AuditLogSerializer, AuditLogDetailSerializer, 
    ActivityFeedSerializer, DataRetentionPolicySerializer,
    AuditLogSummarySerializer
)
from .services import AuditService

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing audit logs (read-only)"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'severity', 'user', 'content_type']
    search_fields = ['description', 'object_repr', 'user__username']
    ordering_fields = ['timestamp', 'action']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        user = self.request.user
        
        # Base queryset
        queryset = AuditLog.objects.all()
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Filter by object type
        object_type = self.request.query_params.get('object_type')
        object_id = self.request.query_params.get('object_id')
        
        if object_type and object_id:
            content_type = ContentType.objects.get(model=object_type)
            queryset = queryset.filter(
                content_type=content_type,
                object_id=object_id
            )
        
        # Non-admins can only see logs related to them
        if not user.is_admin:
            queryset = queryset.filter(
                Q(user=user) |
                Q(content_type=ContentType.objects.get_for_model(user), object_id=user.id)
            )
        
        return queryset.select_related('user', 'content_type')
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Get detailed information for a log entry"""
        audit_log = self.get_object()
        
        try:
            detail = audit_log.detail
            serializer = AuditLogDetailSerializer(detail)
            return Response(serializer.data)
        except AuditLogDetail.DoesNotExist:
            return Response({'detail': 'No additional details'})
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary statistics of audit logs"""
        queryset = self.get_queryset()
        
        # Calculate statistics
        total_logs = queryset.count()
        
        logs_by_action = dict(
            queryset.values('action').annotate(
                count=Count('id')
            ).values_list('action', 'count')
        )
        
        logs_by_user = dict(
            queryset.values('user__username').annotate(
                count=Count('id')
            ).values_list('user__username', 'count')[:10]
        )
        
        logs_by_severity = dict(
            queryset.values('severity').annotate(
                count=Count('id')
            ).values_list('severity', 'count')
        )
        
        recent_activity = queryset[:10]
        
        top_users = list(
            queryset.values('user__username', 'user__id').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
        )
        
        serializer = AuditLogSummarySerializer({
            'total_logs': total_logs,
            'logs_by_action': logs_by_action,
            'logs_by_user': logs_by_user,
            'logs_by_severity': logs_by_severity,
            'recent_activity': recent_activity,
            'top_users': top_users,
        })
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export audit logs (admin only)"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can export logs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get filtered queryset
        queryset = self.get_queryset()
        
        # Prepare export data
        export_data = []
        for log in queryset[:1000]:  # Limit to 1000 for performance
            export_data.append({
                'timestamp': log.timestamp.isoformat(),
                'user': log.user.username if log.user else 'System',
                'action': log.action,
                'description': log.description,
                'object': log.object_repr,
                'severity': log.severity,
                'ip_address': log.user_ip,
            })
        
        # Log the export action
        AuditService.log(
            request=request,
            action=AuditLog.ActionType.DATA_EXPORT,
            description=f"Exported {len(export_data)} audit logs",
            severity='INFO'
        )
        
        return Response({
            'count': len(export_data),
            'logs': export_data
        })


class ActivityFeedViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for user activity feeds"""
    serializer_class = ActivityFeedSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ActivityFeed.objects.filter(
            user=self.request.user
        ).select_related('audit_log', 'audit_log__user')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a feed item as read"""
        feed_item = self.get_object()
        feed_item.mark_as_read()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all feed items as read"""
        self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'status': 'all marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread feed items"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'unread_count': count})


class DataRetentionPolicyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing data retention policies (admin only)"""
    queryset = DataRetentionPolicy.objects.all()
    serializer_class = DataRetentionPolicySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_admin:
            return DataRetentionPolicy.objects.none()
        return super().get_queryset()
    
    @action(detail=False, methods=['post'])
    def apply_retention(self, request):
        """Apply retention policies (delete old logs)"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can apply retention policies'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        deleted_count = 0
        policies = DataRetentionPolicy.objects.filter(auto_delete=True)
        
        for policy in policies:
            cutoff_date = timezone.now() - timezone.timedelta(days=policy.retention_days)
            old_logs = AuditLog.objects.filter(
                action=policy.action_type,
                timestamp__lt=cutoff_date
            )
            deleted_count += old_logs.count()
            old_logs.delete()
        
        # Log the cleanup action
        AuditService.log(
            request=request,
            action='DATA_RETENTION_APPLIED',
            description=f"Applied retention policies, deleted {deleted_count} old logs",
            severity='INFO'
        )
        
        return Response({
            'message': f'Retention policies applied',
            'deleted_count': deleted_count
        })


class ObjectHistoryView(viewsets.ViewSet):
    """View for getting history of a specific object"""
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, content_type, object_id):
        """Get history for a specific object"""
        try:
            content_type_obj = ContentType.objects.get(model=content_type)
            logs = AuditLog.objects.filter(
                content_type=content_type_obj,
                object_id=object_id
            ).select_related('user')
            
            serializer = AuditLogSerializer(logs, many=True)
            return Response(serializer.data)
        except ContentType.DoesNotExist:
            return Response(
                {'error': 'Invalid content type'},
                status=status.HTTP_400_BAD_REQUEST
            )