from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.db import transaction
import json
import ipaddress
from .models import AuditLog, AuditLogDetail, ActivityFeed

class AuditService:
    """
    Service class for creating audit logs consistently
    """
    
    @classmethod
    def log(cls, request=None, user=None, action=None, description="", 
            content_object=None, changes=None, severity='INFO', status=''):
        """
        Main method to create audit logs
        """
        # Get user from request if not provided
        if request and hasattr(request, 'user'):
            user = user or request.user
            
        # Get IP and user agent from request
        user_ip = None
        user_agent = None
        if request:
            # Get real IP behind proxy
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                user_ip = x_forwarded_for.split(',')[0]
            else:
                user_ip = request.META.get('REMOTE_ADDR')
            
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Create audit log
        with transaction.atomic():
            audit_log = AuditLog.objects.create(
                user=user if user and user.is_authenticated else None,
                user_ip=user_ip,
                user_agent=user_agent,
                action=action,
                description=description,
                content_type=ContentType.objects.get_for_model(content_object) if content_object else None,
                object_id=content_object.id if content_object else None,
                object_repr=str(content_object) if content_object else '',
                changes=changes or {},
                severity=severity,
                status=status
            )
            
            # Create activity feed items for relevant users
            cls._create_activity_feeds(audit_log, content_object)
            
            # Store large changes in separate table if needed
            if changes and len(json.dumps(changes)) > 1000:  # If changes are large
                AuditLogDetail.objects.create(
                    audit_log=audit_log,
                    data=changes
                )
            
            return audit_log
    
    @classmethod
    def _create_activity_feeds(cls, audit_log, content_object):
        """Create activity feed items for relevant users"""
        relevant_users = set()
        
        # Add the user who performed the action
        if audit_log.user:
            relevant_users.add(audit_log.user)
        
        # Add object owner based on type
        if content_object:
            if hasattr(content_object, 'assigned_to') and content_object.assigned_to:
                relevant_users.add(content_object.assigned_to)
            if hasattr(content_object, 'created_by') and content_object.created_by:
                relevant_users.add(content_object.created_by)
            if hasattr(content_object, 'user') and content_object.user:
                relevant_users.add(content_object.user)
        
        # Create feed items
        for user in relevant_users:
            ActivityFeed.objects.create(
                user=user,
                audit_log=audit_log
            )
    
    @classmethod
    def log_asset_action(cls, request, asset, action, changes=None):
        """Log asset-related actions"""
        action_map = {
            'create': AuditLog.ActionType.ASSET_CREATED,
            'update': AuditLog.ActionType.ASSET_UPDATED,
            'delete': AuditLog.ActionType.ASSET_DELETED,
            'permanent_delete': AuditLog.ActionType.ASSET_PERMANENT_DELETED,
            'restore': AuditLog.ActionType.ASSET_RESTORED,
            'status_change': AuditLog.ActionType.ASSET_STATUS_CHANGED,
        }
        
        descriptions = {
            'create': f"Asset '{asset.name}' was created",
            'update': f"Asset '{asset.name}' was updated",
            'delete': f"Asset '{asset.name}' was soft deleted",
            'permanent_delete': f"Asset '{asset.name}' was permanently deleted",
            'restore': f"Asset '{asset.name}' was restored",
            'status_change': f"Asset '{asset.name}' status changed to {asset.status}",
        }
        
        return cls.log(
            request=request,
            action=action_map.get(action, action),
            description=descriptions.get(action, f"Action performed on asset '{asset.name}'"),
            content_object=asset,
            changes=changes,
            severity='INFO'
        )
    
    @classmethod
    def log_assignment_action(cls, request, assignment, action, changes=None):
        """Log assignment-related actions"""
        action_map = {
            'create': AuditLog.ActionType.ASSIGNMENT_CREATED,
            'update': AuditLog.ActionType.ASSIGNMENT_UPDATED,
            'delete': AuditLog.ActionType.ASSIGNMENT_DELETED,
            'return_request': AuditLog.ActionType.ASSIGNMENT_RETURN_REQUESTED,
            'return_approve': AuditLog.ActionType.ASSIGNMENT_RETURN_APPROVED,
            'return_reject': AuditLog.ActionType.ASSIGNMENT_RETURN_REJECTED,
            'complete': AuditLog.ActionType.ASSIGNMENT_COMPLETED,
            'damage': AuditLog.ActionType.ASSIGNMENT_DAMAGE_REPORTED,
            'overdue': AuditLog.ActionType.ASSIGNMENT_OVERDUE,
        }
        
        descriptions = {
            'create': f"Asset '{assignment.asset.name}' assigned to {assignment.assigned_to.username}",
            'update': f"Assignment #{assignment.id} was updated",
            'delete': f"Assignment #{assignment.id} was deleted",
            'return_request': f"Return requested for asset '{assignment.asset.name}'",
            'return_approve': f"Return approved for asset '{assignment.asset.name}'",
            'return_reject': f"Return rejected for asset '{assignment.asset.name}'",
            'complete': f"Assignment completed for asset '{assignment.asset.name}'",
            'damage': f"Damage reported for asset '{assignment.asset.name}'",
            'overdue': f"Assignment for '{assignment.asset.name}' is overdue",
        }
        
        return cls.log(
            request=request,
            action=action_map.get(action, action),
            description=descriptions.get(action, f"Action performed on assignment #{assignment.id}"),
            content_object=assignment,
            changes=changes,
            severity='WARNING' if action == 'overdue' else 'INFO'
        )
    
    @classmethod
    def log_user_action(cls, request, user, action, changes=None):
        """Log user-related actions"""
        action_map = {
            'create': AuditLog.ActionType.USER_CREATED,
            'update': AuditLog.ActionType.USER_UPDATED,
            'login': AuditLog.ActionType.USER_LOGIN,
            'logout': AuditLog.ActionType.USER_LOGOUT,
            'password_change': AuditLog.ActionType.USER_PASSWORD_CHANGED,
            'role_change': AuditLog.ActionType.USER_ROLE_CHANGED,
        }
        
        descriptions = {
            'create': f"User '{user.username}' was created",
            'update': f"User '{user.username}' was updated",
            'login': f"User '{user.username}' logged in",
            'logout': f"User '{user.username}' logged out",
            'password_change': f"User '{user.username}' changed password",
            'role_change': f"User '{user.username}' role changed to {user.role}",
        }
        
        return cls.log(
            request=request,
            action=action_map.get(action, action),
            description=descriptions.get(action, f"Action performed on user '{user.username}'"),
            content_object=user,
            changes=changes,
            severity='INFO'
        )
    
    @classmethod
    def log_qr_action(cls, request, asset, action):
        """Log QR code actions"""
        action_map = {
            'generate': AuditLog.ActionType.QR_GENERATED,
            'regenerate': AuditLog.ActionType.QR_REGENERATED,
            'scan': AuditLog.ActionType.QR_SCANNED,
            'download': AuditLog.ActionType.QR_DOWNLOADED,
        }
        
        descriptions = {
            'generate': f"QR code generated for asset '{asset.name}'",
            'regenerate': f"QR code regenerated for asset '{asset.name}'",
            'scan': f"QR code scanned for asset '{asset.name}'",
            'download': f"QR code downloaded for asset '{asset.name}'",
        }
        
        return cls.log(
            request=request,
            action=action_map.get(action, action),
            description=descriptions.get(action, f"QR action performed on asset '{asset.name}'"),
            content_object=asset,
            severity='INFO'
        )
    
    @classmethod
    def log_bulk_action(cls, request, action, description, affected_objects, changes=None):
        """Log bulk operations"""
        action_map = {
            'asset_delete': AuditLog.ActionType.BULK_ASSET_DELETE,
            'asset_restore': AuditLog.ActionType.BULK_ASSET_RESTORE,
            'qr_generate': AuditLog.ActionType.BULK_QR_GENERATE,
            'assignment': AuditLog.ActionType.BULK_ASSIGNMENT,
        }
        
        return cls.log(
            request=request,
            action=action_map.get(action, action),
            description=description,
            changes=changes or {'affected_ids': affected_objects},
            severity='WARNING'
        )
    
    @classmethod
    def log_error(cls, request, error, description="System error occurred"):
        """Log system errors"""
        return cls.log(
            request=request,
            action=AuditLog.ActionType.SYSTEM_ERROR,
            description=description,
            changes={'error': str(error)},
            severity='ERROR'
        )