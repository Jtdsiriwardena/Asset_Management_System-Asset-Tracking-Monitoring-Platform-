from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.utils import timezone
from .services import AuditService
from assets.models import Asset
from assignments.models import Assignment, AssignmentHistory
from accounts.models import User

# ========== ASSET SIGNALS ==========

@receiver(post_save, sender=Asset)
def log_asset_changes(sender, instance, created, **kwargs):
    """Log when assets are created or updated"""
    if created:
        AuditService.log_asset_action(
            request=None,  # Request will be added in view
            asset=instance,
            action='create'
        )
    else:
        # Check for status changes
        if instance.pk:
            try:
                old_instance = Asset.objects.get(pk=instance.pk)
                if old_instance.status != instance.status:
                    AuditService.log_asset_action(
                        request=None,
                        asset=instance,
                        action='status_change',
                        changes={'old_status': old_instance.status, 'new_status': instance.status}
                    )
            except Asset.DoesNotExist:
                pass

@receiver(post_delete, sender=Asset)
def log_asset_deletion(sender, instance, **kwargs):
    """Log when assets are permanently deleted"""
    AuditService.log_asset_action(
        request=None,
        asset=instance,
        action='permanent_delete'
    )

# ========== ASSIGNMENT SIGNALS ==========

@receiver(post_save, sender=Assignment)
def log_assignment_changes(sender, instance, created, **kwargs):
    """Log when assignments are created or updated"""
    if created:
        AuditService.log_assignment_action(
            request=None,
            assignment=instance,
            action='create'
        )
    else:
        # Check for status changes
        if instance.pk:
            try:
                old_instance = Assignment.objects.get(pk=instance.pk)
                if old_instance.status != instance.status:
                    action_map = {
                        'RETURN_REQUESTED': 'return_request',
                        'RETURN_APPROVED': 'return_approve',
                        'RETURNED': 'complete',
                        'DAMAGED': 'damage',
                        'REJECTED': 'return_reject',
                        'OVERDUE': 'overdue',
                    }
                    action = action_map.get(instance.status, 'update')
                    
                    AuditService.log_assignment_action(
                        request=None,
                        assignment=instance,
                        action=action,
                        changes={'old_status': old_instance.status, 'new_status': instance.status}
                    )
            except Assignment.DoesNotExist:
                pass

@receiver(post_save, sender=AssignmentHistory)
def log_assignment_history(sender, instance, created, **kwargs):
    """Log when assignment history is created"""
    if created:
        AuditService.log(
            request=None,
            action=f"ASSIGNMENT_HISTORY_{instance.action}",
            description=f"Assignment history: {instance.action}",
            content_object=instance.assignment,
            changes={'history_note': instance.notes}
        )

# ========== USER SIGNALS ==========

@receiver(post_save, sender=User)
def log_user_changes(sender, instance, created, **kwargs):
    """Log when users are created or updated"""
    if created:
        AuditService.log_user_action(
            request=None,
            user=instance,
            action='create'
        )
    else:
        # Check for role changes
        if instance.pk:
            try:
                old_instance = User.objects.get(pk=instance.pk)
                if old_instance.role != instance.role:
                    AuditService.log_user_action(
                        request=None,
                        user=instance,
                        action='role_change',
                        changes={'old_role': old_instance.role, 'new_role': instance.role}
                    )
            except User.DoesNotExist:
                pass

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log user login"""
    AuditService.log_user_action(
        request=request,
        user=user,
        action='login'
    )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log user logout"""
    if user:
        AuditService.log_user_action(
            request=request,
            user=user,
            action='logout'
        )

# ========== CHECK FOR OVERDUE ASSIGNMENTS ==========

def check_overdue_assignments():
    """Background task to check for overdue assignments"""
    from datetime import timedelta
    overdue_assignments = Assignment.objects.filter(
        expected_return_date__lt=timezone.now().date(),
        status__in=['ACTIVE', 'RETURN_REQUESTED']
    )
    
    for assignment in overdue_assignments:
        AuditService.log_assignment_action(
            request=None,
            assignment=assignment,
            action='overdue'
        )