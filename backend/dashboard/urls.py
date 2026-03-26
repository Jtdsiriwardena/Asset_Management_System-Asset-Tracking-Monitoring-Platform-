from django.urls import path
from . import views

urlpatterns = [
    path('', views.get_dashboard_data, name='dashboard'),
    path('summary/', views.get_summary, name='dashboard-summary'),
    path('assets/', views.get_asset_stats, name='dashboard-assets'),
    path('assignments/', views.get_assignment_stats, name='dashboard-assignments'),
    path('export/', views.export_dashboard_data, name='dashboard-export'),
]