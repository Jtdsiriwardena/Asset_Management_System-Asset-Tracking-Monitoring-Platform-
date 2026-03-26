from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'logs', views.AuditLogViewSet)
router.register(r'feed', views.ActivityFeedViewSet, basename='activity-feed')
router.register(r'retention', views.DataRetentionPolicyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('object/<str:content_type>/<int:object_id>/', 
         views.ObjectHistoryView.as_view({'get': 'retrieve'}),
         name='object-history'),
]