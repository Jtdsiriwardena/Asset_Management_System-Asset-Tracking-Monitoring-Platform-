from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum, Avg
from django.utils import timezone
from django.http import FileResponse, HttpResponse
from .models import Asset, Category
from .serializers import (
    AssetSerializer, AssetListSerializer, 
    CategorySerializer, AssetBulkDeleteSerializer,
    AssetQRSerializer, AssetBulkQRGenerateSerializer
)
from .filters import AssetFilter
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from accounts.permissions import IsAdminUser
import os
import zipfile
from io import BytesIO
import qrcode
from PIL import Image, ImageDraw, ImageFont
from datetime import timedelta
import uuid

# PDF Generation imports
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Asset Categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    
    def get_permissions(self):
        """Only admins can create/update/delete categories"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        serializer.save()


class AssetViewSet(viewsets.ModelViewSet):
    """ViewSet for Asset CRUD operations"""
    queryset = Asset.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AssetFilter
    search_fields = ['name', 'serial_number', 'asset_code', 'description', 'vendor']
    ordering_fields = ['name', 'purchase_date', 'created_at', 'purchase_cost']
    ordering = ['-created_at']
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_permissions(self):
        """
        Custom permissions:
        - List and retrieve: Any authenticated user
        - Create, update, delete: Only admins
        """
        print(f"Action: {self.action}")
        print(f"User: {self.request.user}")
        print(f"Is admin: {self.request.user.is_admin if self.request.user.is_authenticated else False}")
        
        if self.action in ['create', 'update', 'partial_update', 'destroy', 
                          'permanent_delete', 'bulk_delete', 'bulk_regenerate_qr',
                          'regenerate_qr', 'generate_qr_sheet', 'download_multiple_qr']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AssetListSerializer
        return AssetSerializer
    
    def get_queryset(self):
        queryset = Asset.objects.all()
        
        # Filter out soft-deleted items unless specifically requested
        show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
        if not show_deleted:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def perform_destroy(self, instance):
        """Override destroy to implement soft delete"""
        instance.soft_delete()
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore soft-deleted asset"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can restore assets'},
                status=status.HTTP_403_FORBIDDEN
            )
        asset = self.get_object()
        if not asset.is_active:
            asset.restore()
            serializer = self.get_serializer(asset)
            return Response(serializer.data)
        return Response(
            {'error': 'Asset is not deleted'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        """Permanently delete an asset (admin only)"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can permanently delete assets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        asset = self.get_object()
        # Delete files from storage
        if asset.image:
            asset.image.delete(save=False)
        if asset.invoice:
            asset.invoice.delete(save=False)
        if asset.qr_code:
            asset.qr_code.delete(save=False)
        
        asset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple assets"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can perform bulk delete'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AssetBulkDeleteSerializer(data=request.data)
        if serializer.is_valid():
            asset_ids = serializer.validated_data['asset_ids']
            permanent = serializer.validated_data['permanent']
            
            assets = Asset.objects.filter(id__in=asset_ids)
            
            if permanent:
                # Delete files for each asset
                for asset in assets:
                    if asset.image:
                        asset.image.delete(save=False)
                    if asset.invoice:
                        asset.invoice.delete(save=False)
                    if asset.qr_code:
                        asset.qr_code.delete(save=False)
                assets.delete()
                message = f"Permanently deleted {assets.count()} assets"
            else:
                for asset in assets:
                    asset.soft_delete()
                message = f"Soft deleted {assets.count()} assets"
            
            return Response({'message': message}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get asset statistics for dashboard"""
        try:
            # Get only active assets
            active_assets = Asset.objects.filter(is_active=True)
            
            # Calculate statistics
            total_assets = active_assets.count()
            
            # Total value (sum of purchase costs)
            total_value = active_assets.aggregate(
                total=Sum('purchase_cost')
            )['total'] or 0
            
            # Average cost
            avg_cost = active_assets.aggregate(
                avg=Avg('purchase_cost')
            )['avg'] or 0
            
            # Warranty expiring soon (next 30 days)
            today = timezone.now().date()
            thirty_days_later = today + timedelta(days=30)
            
            warranty_expiring = active_assets.filter(
                warranty_expiry__gte=today,
                warranty_expiry__lte=thirty_days_later
            ).count()
            
            # Assets by status
            by_status = active_assets.values('status').annotate(
                count=Count('id')
            ).order_by('status')
            
            # Recent assets (last 5)
            recent = active_assets.order_by('-created_at')[:5].values(
                'id', 'name', 'asset_code', 'created_at'
            )
            
            stats_data = {
                'total_assets': total_assets,
                'total_value': float(total_value),
                'average_cost': float(avg_cost),
                'warranty_expiring_soon': warranty_expiring,
                'by_status': list(by_status),
                'recent_assets': list(recent),
            }
            
            print("Stats data:", stats_data)
            return Response(stats_data)
            
        except Exception as e:
            print(f"Error in stats endpoint: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'Failed to fetch statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # ==================== QR CODE METHODS ====================
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def scan(self, request, pk=None):
        """Public endpoint for QR code scanning"""
        asset = self.get_object()
        
        # Increment scan counter
        asset.increment_scan_count()
        
        # Return minimal asset info for scanner
        serializer = AssetQRSerializer(asset, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def regenerate_qr(self, request, pk=None):
        """Regenerate QR code for an asset"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can regenerate QR codes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        asset = self.get_object()
        asset.regenerate_qr_code()
        
        serializer = self.get_serializer(asset)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_regenerate_qr(self, request):
        """Bulk regenerate QR codes for multiple assets"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can regenerate QR codes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = AssetBulkQRGenerateSerializer(data=request.data)
        if serializer.is_valid():
            asset_ids = serializer.validated_data['asset_ids']
            assets = Asset.objects.filter(id__in=asset_ids)
            
            regenerated = []
            failed = []
            
            for asset in assets:
                try:
                    asset.regenerate_qr_code()
                    regenerated.append(asset.id)
                except Exception as e:
                    failed.append({'id': asset.id, 'error': str(e)})
            
            return Response({
                'regenerated': regenerated,
                'failed': failed,
                'total': len(asset_ids)
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def download_qr(self, request, pk=None):
        """Download individual QR code"""
        asset = self.get_object()
        
        if not asset.qr_code:
            return Response(
                {'error': 'QR code not found for this asset'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        file_path = asset.qr_code.path
        response = FileResponse(
            open(file_path, 'rb'),
            content_type='image/png'
        )
        response['Content-Disposition'] = f'attachment; filename="{asset.asset_code}_qr.png"'
        return response
    
    @action(detail=False, methods=['post'])
    def download_multiple_qr(self, request):
        """Download multiple QR codes as ZIP"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can download multiple QR codes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        asset_ids = request.data.get('asset_ids', [])
        
        if not asset_ids:
            return Response(
                {'error': 'No asset IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assets = Asset.objects.filter(id__in=asset_ids, qr_code__isnull=False)
        
        if not assets.exists():
            return Response(
                {'error': 'No QR codes found for selected assets'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for asset in assets:
                if asset.qr_code:
                    file_path = asset.qr_code.path
                    arcname = f"{asset.asset_code}_qr.png"
                    zip_file.write(file_path, arcname)
        
        zip_buffer.seek(0)
        
        response = HttpResponse(zip_buffer, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="asset_qr_codes.zip"'
        return response
    
    @action(detail=False, methods=['post'])
    def generate_qr_sheet(self, request):
        """Generate a printable PDF sheet with multiple QR codes"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can generate QR sheets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        asset_ids = request.data.get('asset_ids', [])
        
        if not asset_ids:
            return Response(
                {'error': 'No asset IDs provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assets = Asset.objects.filter(id__in=asset_ids, qr_code__isnull=False).select_related('category')
        
        if not assets.exists():
            return Response(
                {'error': 'No QR codes found for selected assets'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create PDF in memory
        buffer = BytesIO()
        
        # Create the PDF object using ReportLab
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter, landscape
        from reportlab.lib.units import inch
        
        # Use landscape orientation for better grid layout
        pagesize = landscape(letter)
        width, height = pagesize
        
        # Create canvas
        c = canvas.Canvas(buffer, pagesize=pagesize)
        
        # Set up grid parameters
        cols = 3  # 3 columns
        rows = 3  # 3 rows per page (9 QR codes per page)
        margin = 50  # Margin from edges
        cell_width = (width - 2 * margin) / cols
        cell_height = (height - 2 * margin) / rows
        
        # Add title
        c.setFont("Helvetica-Bold", 16)
        c.drawString(margin, height - 30, "Asset QR Codes Sheet")
        c.setFont("Helvetica", 10)
        c.drawString(margin, height - 45, f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M')}")
        
        # Draw grid lines (optional)
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.setLineWidth(0.5)
        
        # Draw vertical grid lines
        for i in range(1, cols):
            x = margin + i * cell_width
            c.line(x, height - margin, x, margin)
        
        # Draw horizontal grid lines
        for i in range(1, rows):
            y = height - margin - i * cell_height
            c.line(margin, y, width - margin, y)
        
        # Loop through assets and place QR codes in grid
        for idx, asset in enumerate(assets):
            if idx >= 9:  # Max 9 per page
                # Start new page
                c.showPage()
                # Reset for next page
                idx = idx % 9
            
            # Calculate grid position
            col = idx % cols
            row = idx // cols
            
            # Calculate cell boundaries
            cell_x = margin + col * cell_width
            cell_y = height - margin - (row + 1) * cell_height
            
            # Draw cell border (light gray)
            c.setStrokeColorRGB(0.9, 0.9, 0.9)
            c.rect(cell_x + 5, cell_y + 5, cell_width - 10, cell_height - 10)
            
            # Add QR code if exists
            if asset.qr_code and os.path.exists(asset.qr_code.path):
                try:
                    # Calculate QR code size (fit in cell with padding)
                    qr_size = min(cell_width - 40, cell_height - 70)
                    qr_x = cell_x + (cell_width - qr_size) / 2
                    qr_y = cell_y + 50  # Leave space for text at bottom
                    
                    # Draw the QR code image
                    c.drawImage(
                        asset.qr_code.path,
                        qr_x,
                        qr_y,
                        width=qr_size,
                        height=qr_size,
                        preserveAspectRatio=True
                    )
                except Exception as e:
                    print(f"Error drawing QR code for asset {asset.id}: {e}")
                    # Draw placeholder if QR code can't be loaded
                    c.setFillColorRGB(0.95, 0.95, 0.95)
                    c.rect(cell_x + 20, cell_y + 30, cell_width - 40, cell_height - 80, fill=1)
                    c.setFillColorRGB(0, 0, 0)
                    c.setFont("Helvetica", 8)
                    c.drawCentredString(
                        cell_x + cell_width/2, 
                        cell_y + cell_height/2, 
                        "QR Code"
                    )
            
            # Add asset code
            c.setFont("Helvetica-Bold", 8)
            c.setFillColorRGB(0, 0, 0)
            c.drawCentredString(
                cell_x + cell_width/2,
                cell_y + 25,
                asset.asset_code
            )
            
            # Add asset name (truncated if too long)
            name = asset.name[:25] + "..." if len(asset.name) > 25 else asset.name
            c.setFont("Helvetica", 7)
            c.drawCentredString(
                cell_x + cell_width/2,
                cell_y + 15,
                name
            )
            
            # Add category
            category_name = asset.category.name if asset.category else "Uncategorized"
            c.setFont("Helvetica-Oblique", 6)
            c.setFillColorRGB(0.4, 0.4, 0.4)
            c.drawCentredString(
                cell_x + cell_width/2,
                cell_y + 5,
                category_name
            )
        
        # Save the PDF
        c.save()
        buffer.seek(0)
        
        # Return PDF response
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="qr_sheet_{timezone.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        
        # Log the action
        from history.services import AuditService
        AuditService.log_bulk_action(
            request=request,
            action='qr_generate',
            description=f"Generated QR sheet with {assets.count()} assets",
            affected_objects=list(asset_ids)
        )
        
        return response
    
    @action(detail=False, methods=['get'])
    def scan_stats(self, request):
        """Get QR scan statistics"""
        from django.db.models import Sum, Count
        
        stats = {
            'total_scans': Asset.objects.aggregate(total=Sum('qr_scan_count'))['total'] or 0,
            'scanned_assets': Asset.objects.filter(qr_scan_count__gt=0).count(),
            'never_scanned': Asset.objects.filter(qr_scan_count=0, is_active=True).count(),
            'most_scanned': list(Asset.objects.filter(
                qr_scan_count__gt=0
            ).order_by('-qr_scan_count')[:5].values(
                'id', 'name', 'asset_code', 'qr_scan_count', 'last_scanned'
            ))
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export assets as CSV file"""
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can export data'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        import csv
        from django.http import StreamingHttpResponse
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="assets_export_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Asset Code', 'Name', 'Serial Number', 'Category', 'Status',
            'Purchase Date', 'Purchase Cost', 'Warranty Expiry', 'Vendor',
            'Created At', 'Created By', 'QR Scans'
        ])
        
        assets = self.get_queryset().select_related('category', 'created_by')
        
        for asset in assets:
            writer.writerow([
                asset.asset_code,
                asset.name,
                asset.serial_number,
                asset.category.name if asset.category else '',
                asset.status,
                asset.purchase_date,
                asset.purchase_cost,
                asset.warranty_expiry,
                asset.vendor,
                asset.created_at.strftime('%Y-%m-%d %H:%M') if asset.created_at else '',
                asset.created_by.username if asset.created_by else '',
                asset.qr_scan_count
            ])
        
        return response