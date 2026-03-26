from rest_framework import serializers
from .models import Asset, Category
import os

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class AssetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    image_url = serializers.SerializerMethodField()
    invoice_url = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Asset
        fields = [
            'id', 'asset_code', 'name', 'serial_number', 'category', 'category_name',
            'description', 'status', 'purchase_date', 'purchase_cost', 'warranty_expiry',
            'vendor', 'image', 'image_url', 'invoice', 'invoice_url', 
            'qr_code', 'qr_code_url', 'qr_scan_count', 'last_scanned',
            'created_at', 'updated_at', 'created_by', 'created_by_name', 'is_active'
        ]
        read_only_fields = [
            'id', 'asset_code', 'qr_code', 'qr_scan_count', 'last_scanned',
            'created_at', 'updated_at', 'is_active'
        ]
        extra_kwargs = {
            'image': {'write_only': True},
            'invoice': {'write_only': True},
        }
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_invoice_url(self, obj):
        if obj.invoice:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.invoice.url)
            return obj.invoice.url
        return None
    
    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None
    
    def validate_serial_number(self, value):
        """Check if serial number is unique (excluding current instance)"""
        instance_id = self.instance.id if self.instance else None
        if Asset.objects.filter(serial_number=value).exclude(id=instance_id).exists():
            raise serializers.ValidationError("Asset with this serial number already exists.")
        return value

class AssetListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Asset
        fields = [
            'id', 'asset_code', 'name', 'serial_number', 'category_name',
            'status', 'purchase_date', 'warranty_expiry', 'is_active'
        ]

class AssetQRSerializer(serializers.ModelSerializer):
    """Serializer specifically for QR code data"""
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Asset
        fields = [
            'id', 'asset_code', 'name', 'serial_number', 'status',
            'category', 'qr_code_url', 'qr_scan_count'
        ]
    
    def get_qr_code_url(self, obj):
        if obj.qr_code:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code.url)
            return obj.qr_code.url
        return None

class AssetBulkDeleteSerializer(serializers.Serializer):
    """Serializer for bulk delete operation"""
    asset_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
    permanent = serializers.BooleanField(default=False)

class AssetBulkQRGenerateSerializer(serializers.Serializer):
    """Serializer for bulk QR generation"""
    asset_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )