from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer, NotificationPreferenceSerializer,
    NotificationMarkReadSerializer, NotificationCountSerializer
)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter notifications for the current user"""
        queryset = Notification.objects.filter(
            recipient=self.request.user,
            is_deleted=False
        ).select_related('sender', 'content_type')
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            is_read = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read)
        
        # Filter by type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Mark notifications as read"""
        serializer = NotificationMarkReadSerializer(data=request.data)
        if serializer.is_valid():
            if serializer.validated_data.get('all'):
                # Mark all as read
                self.get_queryset().filter(is_read=False).update(
                    is_read=True,
                    read_at=timezone.now()
                )
                count = self.get_queryset().filter(is_read=False).count()
                return Response({
                    'message': 'All notifications marked as read',
                    'unread_count': count
                })
            else:
                # Mark specific notifications as read
                notification_ids = serializer.validated_data.get('notification_ids', [])
                if notification_ids:
                    self.get_queryset().filter(
                        id__in=notification_ids,
                        is_read=False
                    ).update(
                        is_read=True,
                        read_at=timezone.now()
                    )
                
                unread_count = self.get_queryset().filter(is_read=False).count()
                return Response({
                    'message': f'{len(notification_ids)} notifications marked as read',
                    'unread_count': unread_count
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def mark_unread(self, request):
        """Mark notifications as unread"""
        notification_ids = request.data.get('notification_ids', [])
        
        if notification_ids:
            self.get_queryset().filter(
                id__in=notification_ids,
                is_read=True
            ).update(
                is_read=False,
                read_at=None
            )
        
        unread_count = self.get_queryset().filter(is_read=False).count()
        return Response({
            'message': f'{len(notification_ids)} notifications marked as unread',
            'unread_count': unread_count
        })
    
    @action(detail=False, methods=['get'])
    def counts(self, request):
        """Get notification counts"""
        queryset = self.get_queryset()
        counts = {
            'total': queryset.count(),
            'unread': queryset.filter(is_read=False).count(),
            'read': queryset.filter(is_read=True).count(),
        }
        serializer = NotificationCountSerializer(counts)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Delete all notifications"""
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def toggle_read(self, request, pk=None):
        """Toggle read/unread status"""
        notification = self.get_object()
        
        if notification.is_read:
            notification.mark_as_unread()
        else:
            notification.mark_as_read()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notification preferences
    """
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def get_object(self):
        obj, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return obj
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)