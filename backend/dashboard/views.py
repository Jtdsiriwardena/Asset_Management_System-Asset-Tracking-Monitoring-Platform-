from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from .services import DashboardService
from assets.models import Asset
from assignments.models import Assignment
import csv
import json
from datetime import datetime

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    """Get all dashboard data"""
    data = DashboardService.get_dashboard_data()
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_summary(request):
    """Get summary statistics only"""
    data = DashboardService.get_summary_stats()
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_asset_stats(request):
    """Get asset statistics"""
    data = {
        'by_status': DashboardService.get_asset_stats_by_status(),
        'by_category': DashboardService.get_asset_stats_by_category(),
        'trends': DashboardService.get_asset_trends(
            request.GET.get('period', 'month'),
            int(request.GET.get('months', 12))
        )
    }
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assignment_stats(request):
    """Get assignment statistics"""
    data = {
        'trends': DashboardService.get_assignment_trends(
            request.GET.get('period', 'month'),
            int(request.GET.get('months', 6))
        ),
        'overdue': DashboardService.get_overdue_assignments(10),
        'top_employees': DashboardService.get_top_employees(5)
    }
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_dashboard_data(request):
    """Export dashboard data as CSV"""
    try:
        format_type = request.GET.get('format', 'csv')
        data_type = request.GET.get('type', 'assets')
        
        if format_type == 'csv':
            return export_as_csv(request, data_type)
        else:
            return export_as_json(request, data_type)
    except Exception as e:
        print(f"Export error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def export_as_csv(request, data_type):
    """Export data as CSV"""
    try:
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="dashboard_{data_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        
        if data_type == 'assets':
            # Write headers
            writer.writerow(['Status', 'Count', 'Percentage'])
            
            # Write data
            total = Asset.objects.filter(is_active=True).count()
            status_data = DashboardService.get_asset_stats_by_status()
            
            for item in status_data:
                percentage = (item['count'] / total * 100) if total > 0 else 0
                writer.writerow([item['label'], item['count'], f"{percentage:.1f}%"])
        
        elif data_type == 'categories':
            writer.writerow(['Category', 'Asset Count', 'Total Value', 'Average Value'])
            
            category_data = DashboardService.get_asset_stats_by_category()
            for item in category_data:
                writer.writerow([
                    item['name'],
                    item['count'],
                    f"${item['total_value']:,.2f}",
                    f"${item['average_value']:,.2f}"
                ])
        
        elif data_type == 'warranties':
            writer.writerow(['Asset Code', 'Asset Name', 'Category', 'Warranty Expiry', 'Days Remaining'])
            
            warranties = DashboardService.get_upcoming_warranties(365, 100)
            for item in warranties:
                writer.writerow([
                    item['asset_code'],
                    item['name'],
                    item['category'],
                    item['warranty_expiry'],
                    item['days_remaining']
                ])
        
        elif data_type == 'overdue':
            writer.writerow(['Asset', 'Assigned To', 'Expected Return', 'Days Overdue'])
            
            overdue = DashboardService.get_overdue_assignments(100)
            for item in overdue:
                writer.writerow([
                    f"{item['asset']['name']} ({item['asset']['asset_code']})",
                    item['assigned_to']['name'],
                    item['expected_return_date'],
                    item['days_overdue']
                ])
        
        elif data_type == 'assignments':
            writer.writerow(['Assignment ID', 'Asset', 'Assigned To', 'Status', 'Assigned Date', 'Expected Return'])
            
            from assignments.models import Assignment
            assignments = Assignment.objects.all().select_related('asset', 'assigned_to')[:500]
            for a in assignments:
                writer.writerow([
                    a.id,
                    a.asset.name if a.asset else 'N/A',
                    a.assigned_to.username if a.assigned_to else 'N/A',
                    a.status,
                    a.assigned_date.strftime('%Y-%m-%d') if a.assigned_date else 'N/A',
                    a.expected_return_date or 'N/A'
                ])
        
        return response
    except Exception as e:
        print(f"CSV Export error: {e}")
        raise e

def export_as_json(request, data_type):
    """Export data as JSON"""
    try:
        data = {}
        
        if data_type == 'all':
            data = DashboardService.get_dashboard_data()
        elif data_type == 'summary':
            data = DashboardService.get_summary_stats()
        elif data_type == 'assets':
            data = {
                'by_status': DashboardService.get_asset_stats_by_status(),
                'by_category': DashboardService.get_asset_stats_by_category(),
                'trends': DashboardService.get_asset_trends('month', 12)
            }
        elif data_type == 'assignments':
            data = {
                'trends': DashboardService.get_assignment_trends('month', 6),
                'overdue': DashboardService.get_overdue_assignments(100),
                'top_employees': DashboardService.get_top_employees(10)
            }
        
        response = HttpResponse(json.dumps(data, indent=2, default=str), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="dashboard_{data_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json"'
        return response
    except Exception as e:
        print(f"JSON Export error: {e}")
        raise e