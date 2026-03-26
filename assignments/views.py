from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone

from accounts import serializers
from .models import Assignment, AssignmentHistory
from .serializers import (
    AssignmentSerializer, AssignmentCreateSerializer,
    ReturnRequestSerializer, DamageReportSerializer,
    ReturnApprovalSerializer, AssignmentStatsSerializer,
    AssignmentHistorySerializer
)
from assets.models import Asset
from accounts.models import User


class AssignmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Assignment CRUD operations
    Provides all assignment-related endpoints including creation,
    retrieval, updates, and custom actions for workflow management.
    """
    queryset = Assignment.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'assigned_to', 'asset']
    search_fields = ['asset__name', 'asset__asset_code', 'assigned_to__username', 'notes', 'return_notes']
    ordering_fields = ['assigned_date', 'expected_return_date', 'created_at', 'updated_at']
    ordering = ['-assigned_date']

    def get_serializer_class(self):
        """
        Return different serializers based on action
        - create: AssignmentCreateSerializer (minimal fields for creation)
        - others: AssignmentSerializer (full details)
        """
        if self.action == 'create':
            return AssignmentCreateSerializer
        return AssignmentSerializer

    def get_queryset(self):
        """
        Customize queryset based on user role and query parameters
        - Admins: See all assignments
        - Employees: See only their own assignments
        - Optional filtering by status and overdue
        """
        user = self.request.user
        
        # Start with base queryset with all related fields prefetched for efficiency
        queryset = Assignment.objects.all().select_related(
            'asset', 
            'assigned_to', 
            'assigned_by',
            'approved_by'
        ).prefetch_related('history')
        
        # Filter based on user role
        if not user.is_admin:
            # Employees only see their own assignments
            queryset = queryset.filter(assigned_to=user)
        
        # Apply status filter if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Apply overdue filter if requested
        overdue = self.request.query_params.get('overdue', None)
        if overdue and overdue.lower() == 'true':
            queryset = queryset.filter(
                expected_return_date__lt=timezone.now().date(),
                status__in=['ACTIVE', 'RETURN_REQUESTED']
            )
        
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Override create method to return full assignment data with all details
        This ensures the frontend receives complete assignment information
        immediately after creation.
        """
        try:
            # Log incoming data for debugging
            print("=" * 50)
            print("Creating new assignment")
            print("Request data:", request.data)
            print("User:", request.user.username)
            print("Is Admin:", request.user.is_admin)
            
            # Validate the input data
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Create the assignment
            assignment = serializer.save(
                assigned_by=request.user,
                status=Assignment.AssignmentStatus.ACTIVE
            )
            
            print(f"Assignment created with ID: {assignment.id}")
            print(f"Asset: {assignment.asset.name}")
            print(f"Assigned to: {assignment.assigned_to.username}")
            
            # Create history entry for this assignment
            AssignmentHistory.objects.create(
                assignment=assignment,
                action=AssignmentHistory.Action.ASSIGNED,
                performed_by=request.user,
                notes=f"Asset '{assignment.asset.name}' assigned to {assignment.assigned_to.username}"
            )
            
            print("History entry created")
            
            # Return the full assignment data using the detailed serializer
            response_serializer = AssignmentSerializer(
                assignment, 
                context={'request': request}
            )
            
            print("Response data prepared successfully")
            print("=" * 50)
            
            headers = self.get_success_headers(response_serializer.data)
            return Response(
                response_serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
            
        except serializers.ValidationError as e:
            print("Validation error:", str(e))
            return Response(
                {'error': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print("Unexpected error creating assignment:", str(e))
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to create assignment: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single assignment with all details
        Includes error handling for non-existent or inaccessible assignments
        """
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error retrieving assignment {kwargs.get('pk')}: {e}")
            return Response(
                {'error': 'Assignment not found or you do not have permission to view it'},
                status=status.HTTP_404_NOT_FOUND
            )

    def update(self, request, *args, **kwargs):
        """
        Update an assignment (partial updates allowed)
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Log the update in history
        AssignmentHistory.objects.create(
            assignment=instance,
            action="UPDATED",
            performed_by=request.user,
            notes="Assignment details updated"
        )
        
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Delete an assignment (soft delete by changing status)
        """
        instance = self.get_object()
        
        # Log the deletion in history
        AssignmentHistory.objects.create(
            assignment=instance,
            action="DELETED",
            performed_by=request.user,
            notes="Assignment deleted"
        )
        
        # Instead of actual delete, mark as deleted
        instance.status = 'DELETED'
        instance.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ==================== CUSTOM ACTIONS ====================

    @action(detail=False, methods=['get'])
    def available_assets(self, request):
        """
        Get list of available assets for assignment
        Returns assets with status 'AVAILABLE' that are active
        """
        try:
            print("=" * 50)
            print("Fetching available assets")
            print("User:", request.user.username)
            
            if not request.user.is_admin:
                print("Access denied - not admin")
                return Response(
                    {'error': 'Only admins can view available assets'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get all available assets
            available_assets = Asset.objects.filter(
                status='AVAILABLE',
                is_active=True
            ).select_related('category').values(
                'id', 
                'name', 
                'asset_code', 
                'serial_number', 
                'category__name'
            ).order_by('name')
            
            # Convert to list for JSON serialization
            assets_list = list(available_assets)
            
            print(f"Found {len(assets_list)} available assets")
            print("=" * 50)
            
            return Response(assets_list)
            
        except Exception as e:
            print(f"Error fetching available assets: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Failed to fetch available assets'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def employees(self, request):
        """
        Get list of employees for assignment dropdown
        Returns all active employees with basic info
        """
        try:
            print("=" * 50)
            print("Fetching employees list")
            print("User:", request.user.username)
            
            if not request.user.is_admin:
                print("Access denied - not admin")
                return Response(
                    {'error': 'Only admins can view employees'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get all active employees
            employees = User.objects.filter(
                role='EMPLOYEE',
                is_active=True
            ).values(
                'id', 
                'username', 
                'email', 
                'first_name', 
                'last_name', 
                'department'
            ).order_by('first_name', 'last_name')
            
            # Convert to list for JSON serialization
            employees_list = list(employees)
            
            print(f"Found {len(employees_list)} employees")
            print("=" * 50)
            
            return Response(employees_list)
            
        except Exception as e:
            print(f"Error fetching employees: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Failed to fetch employees'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def request_return(self, request, pk=None):
        """
        Employee requests to return an asset
        Changes status to RETURN_REQUESTED
        """
        try:
            assignment = self.get_object()
            
            print("=" * 50)
            print(f"Return requested for assignment {pk}")
            print(f"Current status: {assignment.status}")
            print(f"Requested by: {request.user.username}")
            
            # Check permissions
            if assignment.assigned_to != request.user and not request.user.is_admin:
                return Response(
                    {'error': 'You can only request return for your own assignments'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if return can be requested
            if assignment.status != Assignment.AssignmentStatus.ACTIVE:
                return Response(
                    {'error': f'Cannot request return for asset with status {assignment.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = ReturnRequestSerializer(data=request.data)
            if serializer.is_valid():
                # Update assignment status
                assignment.status = Assignment.AssignmentStatus.RETURN_REQUESTED
                assignment.requested_return_date = timezone.now()
                assignment.return_notes = serializer.validated_data.get('notes', '')
                assignment.save()
                
                # Create history entry
                AssignmentHistory.objects.create(
                    assignment=assignment,
                    action=AssignmentHistory.Action.RETURN_REQUESTED,
                    performed_by=request.user,
                    notes=serializer.validated_data.get('notes', '')
                )
                
                print(f"Return requested successfully")
                print("=" * 50)
                
                # Return updated assignment
                response_serializer = AssignmentSerializer(
                    assignment, 
                    context={'request': request}
                )
                return Response(response_serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error requesting return: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def approve_return(self, request, pk=None):
        """
        Admin approves or rejects return request
        If approved: status changes to RETURN_APPROVED
        If rejected: status changes back to ACTIVE
        """
        try:
            if not request.user.is_admin:
                return Response(
                    {'error': 'Only admins can approve returns'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            assignment = self.get_object()
            
            print("=" * 50)
            print(f"Processing return for assignment {pk}")
            print(f"Current status: {assignment.status}")
            
            if assignment.status != Assignment.AssignmentStatus.RETURN_REQUESTED:
                return Response(
                    {'error': 'No pending return request for this asset'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = ReturnApprovalSerializer(data=request.data)
            if serializer.is_valid():
                if serializer.validated_data['approve']:
                    # Approve return
                    assignment.status = Assignment.AssignmentStatus.RETURN_APPROVED
                    assignment.approved_by = request.user
                    assignment.approved_date = timezone.now()
                    assignment.condition_after = serializer.validated_data.get('condition', '')
                    
                    action = AssignmentHistory.Action.RETURN_APPROVED
                    notes = "Return approved"
                    print("Return approved")
                    
                else:
                    # Reject return
                    assignment.status = Assignment.AssignmentStatus.ACTIVE
                    assignment.rejection_reason = serializer.validated_data.get('rejection_reason', '')
                    
                    action = AssignmentHistory.Action.REJECTED
                    notes = f"Return rejected: {serializer.validated_data.get('rejection_reason', '')}"
                    print("Return rejected")
                
                assignment.save()
                
                # Create history entry
                AssignmentHistory.objects.create(
                    assignment=assignment,
                    action=action,
                    performed_by=request.user,
                    notes=notes
                )
                
                print("=" * 50)
                
                # Return updated assignment
                response_serializer = AssignmentSerializer(
                    assignment, 
                    context={'request': request}
                )
                return Response(response_serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error approving return: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def complete_return(self, request, pk=None):
        """
        Complete the return process (admin only)
        Changes status to RETURNED and makes asset available
        """
        try:
            if not request.user.is_admin:
                return Response(
                    {'error': 'Only admins can complete returns'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            assignment = self.get_object()
            
            print("=" * 50)
            print(f"Completing return for assignment {pk}")
            print(f"Current status: {assignment.status}")
            
            if assignment.status != Assignment.AssignmentStatus.RETURN_APPROVED:
                return Response(
                    {'error': 'Return must be approved first'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Complete the return
            assignment.status = Assignment.AssignmentStatus.RETURNED
            assignment.actual_return_date = timezone.now()
            assignment.save()
            
            # Make asset available again
            asset = assignment.asset
            asset.status = 'AVAILABLE'
            asset.save()
            
            # Create history entry
            AssignmentHistory.objects.create(
                assignment=assignment,
                action=AssignmentHistory.Action.RETURNED,
                performed_by=request.user,
                notes="Return completed"
            )
            
            print(f"Return completed successfully")
            print("=" * 50)
            
            # Return updated assignment
            response_serializer = AssignmentSerializer(
                assignment, 
                context={'request': request}
            )
            return Response(response_serializer.data)
            
        except Exception as e:
            print(f"Error completing return: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def report_damage(self, request, pk=None):
        """
        Report damage to assigned asset
        Changes status to DAMAGED
        """
        try:
            assignment = self.get_object()
            
            print("=" * 50)
            print(f"Damage reported for assignment {pk}")
            
            # Check permissions
            if assignment.assigned_to != request.user and not request.user.is_admin:
                return Response(
                    {'error': 'You can only report damage for your own assignments'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if damage can be reported
            valid_statuses = ['ACTIVE', 'RETURN_REQUESTED']
            if assignment.status not in valid_statuses:
                return Response(
                    {'error': f'Cannot report damage for asset with status {assignment.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = DamageReportSerializer(data=request.data)
            if serializer.is_valid():
                # Update assignment
                assignment.status = Assignment.AssignmentStatus.DAMAGED
                assignment.damage_description = serializer.validated_data['description']
                assignment.save()
                
                # Update asset status
                asset = assignment.asset
                asset.status = 'DAMAGED'
                asset.save()
                
                # Create history entry
                AssignmentHistory.objects.create(
                    assignment=assignment,
                    action=AssignmentHistory.Action.DAMAGE_REPORTED,
                    performed_by=request.user,
                    notes=serializer.validated_data['description']
                )
                
                print(f"Damage reported successfully")
                print("=" * 50)
                
                # Return updated assignment
                response_serializer = AssignmentSerializer(
                    assignment, 
                    context={'request': request}
                )
                return Response(response_serializer.data)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error reporting damage: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Get complete history for a specific assignment
        Returns all events in chronological order
        """
        try:
            assignment = self.get_object()
            history_qs = assignment.history.all().select_related('performed_by').order_by('-timestamp')
            serializer = AssignmentHistorySerializer(history_qs, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching history: {e}")
            return Response(
                {'error': 'Failed to fetch history'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def my_assignments(self, request):
        """
        Get current user's assignments (employee view)
        Returns paginated list of assignments for the logged-in user
        """
        try:
            assignments = Assignment.objects.filter(
                assigned_to=request.user
            ).select_related('asset', 'assigned_by', 'approved_by').order_by('-assigned_date')
            
            # Apply pagination
            page = self.paginate_queryset(assignments)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(assignments, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error fetching my assignments: {e}")
            return Response(
                {'error': 'Failed to fetch assignments'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def pending_returns(self, request):
        """
        Get all pending return requests (admin only)
        Returns all assignments with status RETURN_REQUESTED
        """
        try:
            if not request.user.is_admin:
                return Response(
                    {'error': 'Only admins can view pending returns'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            pending = Assignment.objects.filter(
                status=Assignment.AssignmentStatus.RETURN_REQUESTED
            ).select_related('asset', 'assigned_to', 'assigned_by').order_by('-requested_return_date')
            
            page = self.paginate_queryset(pending)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(pending, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error fetching pending returns: {e}")
            return Response(
                {'error': 'Failed to fetch pending returns'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get assignment statistics for dashboard
        Returns counts for various assignment statuses
        """
        try:
            user = request.user
            
            # Base queryset based on user role
            if user.is_admin:
                base_qs = Assignment.objects.all()
            else:
                base_qs = Assignment.objects.filter(assigned_to=user)
            
            today = timezone.now().date()
            
            stats = {
                'total_active': base_qs.filter(status='ACTIVE').count(),
                'total_overdue': base_qs.filter(
                    expected_return_date__lt=today,
                    status__in=['ACTIVE', 'RETURN_REQUESTED']
                ).count(),
                'pending_returns': base_qs.filter(status='RETURN_REQUESTED').count(),
                'total_returned': base_qs.filter(status='RETURNED').count(),
                'damaged_reported': base_qs.filter(status='DAMAGED').count(),
                'total_assignments': base_qs.count(),
                'recent_assignments': AssignmentSerializer(
                    base_qs.order_by('-assigned_date')[:5],
                    many=True,
                    context={'request': request}
                ).data
            }
            
            return Response(stats)
            
        except Exception as e:
            print(f"Error fetching stats: {e}")
            return Response(
                {'error': 'Failed to fetch statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Comprehensive dashboard statistics for admin
        Includes counts and recent activity
        """
        try:
            if not request.user.is_admin:
                return Response(
                    {'error': 'Only admins can view dashboard stats'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            today = timezone.now().date()
            thirty_days_later = today + timezone.timedelta(days=30)
            
            # Assignment statistics
            active_assignments = Assignment.objects.filter(
                status__in=['ACTIVE', 'RETURN_REQUESTED']
            ).count()
            
            overdue_assignments = Assignment.objects.filter(
                expected_return_date__lt=today,
                status__in=['ACTIVE', 'RETURN_REQUESTED']
            ).count()
            
            pending_returns = Assignment.objects.filter(
                status='RETURN_REQUESTED'
            ).count()
            
            returned_today = Assignment.objects.filter(
                status='RETURNED',
                actual_return_date__date=today
            ).count()
            
            # Recent assignments
            recent = Assignment.objects.select_related(
                'asset', 'assigned_to'
            ).order_by('-assigned_date')[:10]
            
            recent_data = []
            for a in recent:
                recent_data.append({
                    'id': a.id,
                    'asset_name': a.asset.name,
                    'asset_code': a.asset.asset_code,
                    'employee_name': f"{a.assigned_to.first_name} {a.assigned_to.last_name}".strip() or a.assigned_to.username,
                    'status': a.status,
                    'assigned_date': a.assigned_date
                })
            
            # Monthly trends (last 6 months)
            monthly_data = []
            for i in range(5, -1, -1):
                month_start = (today.replace(day=1) - timezone.timedelta(days=30*i))
                month_end = (month_start.replace(day=28) + timezone.timedelta(days=4)).replace(day=1)
                
                assigned_count = Assignment.objects.filter(
                    assigned_date__gte=month_start,
                    assigned_date__lt=month_end
                ).count()
                
                returned_count = Assignment.objects.filter(
                    actual_return_date__gte=month_start,
                    actual_return_date__lt=month_end
                ).count()
                
                monthly_data.append({
                    'month': month_start.strftime('%b %Y'),
                    'assigned': assigned_count,
                    'returned': returned_count
                })
            
            return Response({
                'active_assignments': active_assignments,
                'overdue_assignments': overdue_assignments,
                'pending_returns': pending_returns,
                'returned_today': returned_today,
                'recent_assignments': recent_data,
                'monthly_trends': monthly_data
            })
            
        except Exception as e:
            print(f"Error fetching dashboard stats: {e}")
            return Response(
                {'error': 'Failed to fetch dashboard statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )