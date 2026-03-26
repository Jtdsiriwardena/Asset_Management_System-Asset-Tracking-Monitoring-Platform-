from django.db.models import Count, Sum, Avg, Q
from django.db.models.functions import TruncMonth, TruncDay, TruncWeek
from django.utils import timezone
from datetime import timedelta, datetime
from assets.models import Asset, Category
from assignments.models import Assignment
from accounts.models import User
from history.models import AuditLog

class DashboardService:
    """
    Service class for generating dashboard statistics
    """
    
    @classmethod
    def get_summary_stats(cls):
        """Get overall summary statistics"""
        today = timezone.now().date()
        thirty_days_later = today + timedelta(days=30)
        
        # Asset statistics
        total_assets = Asset.objects.filter(is_active=True).count()
        available_assets = Asset.objects.filter(is_active=True, status='AVAILABLE').count()
        assigned_assets = Asset.objects.filter(is_active=True, status='ASSIGNED').count()
        damaged_assets = Asset.objects.filter(is_active=True, status='DAMAGED').count()
        under_repair = Asset.objects.filter(is_active=True, status='UNDER_REPAIR').count()
        retired_assets = Asset.objects.filter(is_active=True, status='RETIRED').count()
        
        # Asset value
        total_value = Asset.objects.filter(
            is_active=True, 
            purchase_cost__isnull=False
        ).aggregate(total=Sum('purchase_cost'))['total'] or 0
        
        avg_value = Asset.objects.filter(
            is_active=True,
            purchase_cost__isnull=False
        ).aggregate(avg=Avg('purchase_cost'))['avg'] or 0
        
        # Warranty statistics
        warranty_expiring_soon = Asset.objects.filter(
            is_active=True,
            warranty_expiry__gte=today,
            warranty_expiry__lte=thirty_days_later
        ).count()
        
        warranty_expired = Asset.objects.filter(
            is_active=True,
            warranty_expiry__lt=today
        ).count()
        
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
        
        # User statistics
        total_users = User.objects.filter(is_active=True).count()
        admin_users = User.objects.filter(is_active=True, role='ADMIN').count()
        employee_users = User.objects.filter(is_active=True, role='EMPLOYEE').count()
        
        # Recent activity count (last 24 hours)
        recent_activity = AuditLog.objects.filter(
            timestamp__gte=timezone.now() - timedelta(hours=24)
        ).count()
        
        return {
            'assets': {
                'total': total_assets,
                'available': available_assets,
                'assigned': assigned_assets,
                'damaged': damaged_assets,
                'under_repair': under_repair,
                'retired': retired_assets,
                'total_value': float(total_value),
                'average_value': float(avg_value),
                'warranty_expiring_soon': warranty_expiring_soon,
                'warranty_expired': warranty_expired,
            },
            'assignments': {
                'active': active_assignments,
                'overdue': overdue_assignments,
                'pending_returns': pending_returns,
            },
            'users': {
                'total': total_users,
                'admins': admin_users,
                'employees': employee_users,
            },
            'activity': {
                'last_24h': recent_activity,
            }
        }
    
    @classmethod
    def get_asset_stats_by_status(cls):
        """Get asset count grouped by status"""
        status_data = Asset.objects.filter(is_active=True).values('status').annotate(
            count=Count('id')
        ).order_by('status')
        
        # Add colors for each status
        status_colors = {
            'AVAILABLE': '#10B981',  # Green
            'ASSIGNED': '#3B82F6',    # Blue
            'UNDER_REPAIR': '#F59E0B', # Yellow
            'DAMAGED': '#EF4444',      # Red
            'RETIRED': '#6B7280',      # Gray
            'RETURN_REQUESTED': '#8B5CF6', # Purple
        }
        
        result = []
        for item in status_data:
            result.append({
                'status': item['status'],
                'count': item['count'],
                'color': status_colors.get(item['status'], '#6B7280'),
                'label': dict(Asset.Status.choices).get(item['status'], item['status'])
            })
        
        return result
    
    @classmethod
    def get_asset_stats_by_category(cls):
        """Get asset count and value by category"""
        category_data = Category.objects.annotate(
            asset_count=Count('assets', filter=Q(assets__is_active=True)),
            total_value=Sum('assets__purchase_cost', filter=Q(assets__is_active=True)),
            avg_value=Avg('assets__purchase_cost', filter=Q(assets__is_active=True))
        ).values('id', 'name', 'asset_count', 'total_value', 'avg_value').order_by('-asset_count')
        
        # Generate colors for categories
        colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ]
        
        result = []
        for idx, item in enumerate(category_data):
            if item['asset_count'] > 0:
                result.append({
                    'id': item['id'],
                    'name': item['name'],
                    'count': item['asset_count'],
                    'total_value': float(item['total_value'] or 0),
                    'average_value': float(item['avg_value'] or 0),
                    'color': colors[idx % len(colors)]
                })
        
        return result
    
    @classmethod
    def get_asset_trends(cls, period='month', months=12):
        """Get asset creation trends over time"""
        try:
            today = timezone.now()
            start_date = today - timedelta(days=30 * months)
            
            # Query assets created in the date range
            assets = Asset.objects.filter(
                created_at__gte=start_date,
                is_active=True
            )
            
            # Generate monthly data
            result = []
            current = start_date.replace(day=1)  # Start from first day of month
            
            while current <= today:
                next_month = current.replace(day=28) + timedelta(days=4)  # Go to next month
                next_month = next_month.replace(day=1)  # First day of next month
                
                # Count assets created in this month
                count = assets.filter(
                    created_at__gte=current,
                    created_at__lt=next_month
                ).count()
                
                result.append({
                    'period': current.strftime('%Y-%m'),
                    'count': count,
                    'date': current.isoformat()
                })
                
                current = next_month
            
            return result
        except Exception as e:
            print(f"Error in get_asset_trends: {e}")
            return []
    
    @classmethod
    def get_assignment_trends(cls, period='month', months=6):
        """Get assignment trends over time"""
        try:
            today = timezone.now()
            start_date = today - timedelta(days=30 * months)
            
            # Query assignments in the date range
            assignments = Assignment.objects.filter(
                assigned_date__gte=start_date
            )
            
            # Generate monthly data
            result = []
            current = start_date.replace(day=1)  # Start from first day of month
            
            while current <= today:
                next_month = current.replace(day=28) + timedelta(days=4)  # Go to next month
                next_month = next_month.replace(day=1)  # First day of next month
                
                # Count assignments created in this month
                assigned = assignments.filter(
                    assigned_date__gte=current,
                    assigned_date__lt=next_month
                ).count()
                
                # Count returns in this month
                returned = assignments.filter(
                    actual_return_date__gte=current,
                    actual_return_date__lt=next_month
                ).count()
                
                result.append({
                    'period': current.strftime('%Y-%m'),
                    'assigned': assigned,
                    'returned': returned,
                    'active': assigned - returned,
                    'date': current.isoformat()
                })
                
                current = next_month
            
            return result
        except Exception as e:
            print(f"Error in get_assignment_trends: {e}")
            return []
    
    @classmethod
    def get_top_employees(cls, limit=5):
        """Get employees with most assigned assets"""
        try:
            employees = User.objects.filter(
                role='EMPLOYEE',
                is_active=True
            ).annotate(
                total_assignments=Count(
                    'assigned_assets',
                    filter=Q(assigned_assets__status__in=['ACTIVE', 'RETURN_REQUESTED', 'RETURNED'])
                ),
                completed_assignments=Count(
                    'assigned_assets',
                    filter=Q(assigned_assets__status='RETURNED')
                )
            ).filter(
                total_assignments__gt=0
            ).order_by('-total_assignments')[:limit]
            
            result = []
            for emp in employees:
                result.append({
                    'id': emp.id,
                    'name': f"{emp.first_name} {emp.last_name}".strip() or emp.username,
                    'username': emp.username,
                    'email': emp.email,
                    'department': emp.department,
                    'total_assignments': emp.total_assignments,
                    'completed_assignments': emp.completed_assignments,
                    'active_assignments': emp.total_assignments - emp.completed_assignments
                })
            
            return result
        except Exception as e:
            print(f"Error in get_top_employees: {e}")
            return []
    
    @classmethod
    def get_recent_activities(cls, limit=10):
        """Get recent activities for the dashboard"""
        try:
            activities = AuditLog.objects.select_related('user').order_by('-timestamp')[:limit]
            
            result = []
            for activity in activities:
                result.append({
                    'id': activity.id,
                    'user': activity.user.username if activity.user else 'System',
                    'action': activity.action,
                    'description': activity.description,
                    'object_repr': activity.object_repr,
                    'timestamp': activity.timestamp.isoformat(),
                    'severity': activity.severity,
                    'time_ago': cls._get_time_ago(activity.timestamp)
                })
            
            return result
        except Exception as e:
            print(f"Error in get_recent_activities: {e}")
            return []
    
    @classmethod
    def get_upcoming_warranties(cls, days=30, limit=10):
        """Get assets with warranties expiring soon"""
        try:
            today = timezone.now().date()
            expiry_date = today + timedelta(days=days)
            
            assets = Asset.objects.filter(
                is_active=True,
                warranty_expiry__gte=today,
                warranty_expiry__lte=expiry_date
            ).select_related('category').order_by('warranty_expiry')[:limit]
            
            result = []
            for asset in assets:
                days_remaining = (asset.warranty_expiry - today).days
                result.append({
                    'id': asset.id,
                    'name': asset.name,
                    'asset_code': asset.asset_code,
                    'category': asset.category.name if asset.category else 'Uncategorized',
                    'warranty_expiry': asset.warranty_expiry.isoformat(),
                    'days_remaining': days_remaining,
                    'status': 'expiring_soon' if days_remaining <= 30 else 'ok',
                    'purchase_cost': float(asset.purchase_cost) if asset.purchase_cost else None
                })
            
            return result
        except Exception as e:
            print(f"Error in get_upcoming_warranties: {e}")
            return []
    
    @classmethod
    def get_overdue_assignments(cls, limit=10):
        """Get overdue assignments"""
        try:
            today = timezone.now().date()
            
            assignments = Assignment.objects.filter(
                expected_return_date__lt=today,
                status__in=['ACTIVE', 'RETURN_REQUESTED']
            ).select_related('asset', 'assigned_to').order_by('expected_return_date')[:limit]
            
            result = []
            for assignment in assignments:
                days_overdue = (today - assignment.expected_return_date).days
                result.append({
                    'id': assignment.id,
                    'asset': {
                        'id': assignment.asset.id,
                        'name': assignment.asset.name,
                        'asset_code': assignment.asset.asset_code
                    },
                    'assigned_to': {
                        'id': assignment.assigned_to.id,
                        'name': f"{assignment.assigned_to.first_name} {assignment.assigned_to.last_name}".strip() or assignment.assigned_to.username,
                        'email': assignment.assigned_to.email
                    },
                    'expected_return_date': assignment.expected_return_date.isoformat(),
                    'days_overdue': days_overdue,
                    'assigned_date': assignment.assigned_date.isoformat()
                })
            
            return result
        except Exception as e:
            print(f"Error in get_overdue_assignments: {e}")
            return []
    
    @classmethod
    def get_dashboard_data(cls):
        """Get complete dashboard data"""
        try:
            return {
                'summary': cls.get_summary_stats(),
                'assets_by_status': cls.get_asset_stats_by_status(),
                'assets_by_category': cls.get_asset_stats_by_category(),
                'asset_trends': cls.get_asset_trends('month', 12),
                'assignment_trends': cls.get_assignment_trends('month', 6),
                'top_employees': cls.get_top_employees(5),
                'recent_activities': cls.get_recent_activities(10),
                'upcoming_warranties': cls.get_upcoming_warranties(30, 5),
                'overdue_assignments': cls.get_overdue_assignments(5),
            }
        except Exception as e:
            print(f"Error in get_dashboard_data: {e}")
            return {
                'summary': cls.get_summary_stats(),
                'assets_by_status': cls.get_asset_stats_by_status(),
                'assets_by_category': cls.get_asset_stats_by_category(),
                'asset_trends': [],
                'assignment_trends': [],
                'top_employees': [],
                'recent_activities': [],
                'upcoming_warranties': [],
                'overdue_assignments': [],
            }
    
    @staticmethod
    def _get_time_ago(timestamp):
        """Get human readable time ago string"""
        now = timezone.now()
        diff = now - timestamp
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"