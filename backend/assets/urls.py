from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet)
router.register(r'', views.AssetViewSet)

# Public scan endpoint (no auth required)
scan_urlpatterns = [
    path('scan/<int:pk>/', views.AssetViewSet.as_view({'get': 'scan'}), name='asset-scan'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('', include(scan_urlpatterns)),
]