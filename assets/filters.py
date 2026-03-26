import django_filters
from .models import Asset, Category
from django.db import models

class AssetFilter(django_filters.FilterSet):
    # Text searches
    name = django_filters.CharFilter(lookup_expr='icontains')
    serial_number = django_filters.CharFilter(lookup_expr='icontains')
    asset_code = django_filters.CharFilter(lookup_expr='icontains')
    description = django_filters.CharFilter(lookup_expr='icontains')
    vendor = django_filters.CharFilter(lookup_expr='icontains')
    
    # Category filter
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    category_id = django_filters.NumberFilter(field_name='category__id')
    
    # Status filter (multiple)
    status = django_filters.MultipleChoiceFilter(choices=Asset.Status.choices)
    
    # Date filters
    purchase_date_from = django_filters.DateFilter(field_name='purchase_date', lookup_expr='gte')
    purchase_date_to = django_filters.DateFilter(field_name='purchase_date', lookup_expr='lte')
    warranty_expiry_from = django_filters.DateFilter(field_name='warranty_expiry', lookup_expr='gte')
    warranty_expiry_to = django_filters.DateFilter(field_name='warranty_expiry', lookup_expr='lte')
    created_at_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_at_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # Cost range
    purchase_cost_min = django_filters.NumberFilter(field_name='purchase_cost', lookup_expr='gte')
    purchase_cost_max = django_filters.NumberFilter(field_name='purchase_cost', lookup_expr='lte')
    
    # Boolean filters
    has_image = django_filters.BooleanFilter(method='filter_has_image')
    has_invoice = django_filters.BooleanFilter(method='filter_has_invoice')
    is_active = django_filters.BooleanFilter()
    
    # Warranty status
    warranty_expired = django_filters.BooleanFilter(method='filter_warranty_expired')
    warranty_expiring_soon = django_filters.BooleanFilter(method='filter_warranty_expiring_soon')
    
    class Meta:
        model = Asset
        fields = []
    
    def filter_has_image(self, queryset, name, value):
        if value:
            return queryset.exclude(image='')
        return queryset.filter(image='')
    
    def filter_has_invoice(self, queryset, name, value):
        if value:
            return queryset.exclude(invoice='')
        return queryset.filter(invoice='')
    
    def filter_warranty_expired(self, queryset, name, value):
        from django.utils import timezone
        today = timezone.now().date()
        if value:
            return queryset.filter(warranty_expiry__lt=today)
        return queryset.filter(warranty_expiry__gte=today)
    
    def filter_warranty_expiring_soon(self, queryset, name, value):
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        thirty_days_later = today + timedelta(days=30)
        
        if value:
            return queryset.filter(
                warranty_expiry__gte=today,
                warranty_expiry__lte=thirty_days_later
            )
        return queryset.exclude(
            warranty_expiry__gte=today,
            warranty_expiry__lte=thirty_days_later
        )