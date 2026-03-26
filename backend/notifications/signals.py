from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .services import NotificationService
from assignments.models import Assignment
from assets.models import Asset
import logging

logger = logging.getLogger(__name__)

# ========== ASSIGNMENT SIGNALS ==========

@receiver(post_save, sender=Assignment)
def handle_assignment_notifications(sender, instance, created, **kwargs):
    """Send notifications for assignment events"""
    logger.info(f"Assignment signal triggered for ID: {instance.id}, Created: {created}")
    
    if created:
        # New assignment created
        logger.info(f"New assignment created, sending notification to {instance.assigned_to.username}")
        NotificationService.notify_assignment_created(instance)
    else:
        # Check for status changes
        if instance.pk:
            try:
                old = Assignment.objects.get(pk=instance.pk)
                
                if old.status != instance.status:
                    logger.info(f"Assignment status changed from {old.status} to {instance.status}")
                    
                    # Return requested
                    if instance.status == 'RETURN_REQUESTED' and old.status != 'RETURN_REQUESTED':
                        logger.info("Return requested, notifying admins")
                        NotificationService.notify_return_requested(instance)
                    
                    # Return approved
                    elif instance.status == 'RETURN_APPROVED' and old.status == 'RETURN_REQUESTED':
                        logger.info("Return approved, notifying employee")
                        NotificationService.notify_return_approved(instance)
                    
                    # Return rejected
                    elif instance.status == 'REJECTED' and old.status == 'RETURN_REQUESTED':
                        logger.info("Return rejected, notifying employee")
                        NotificationService.notify_return_rejected(instance)
                    
                    # Damage reported
                    elif instance.status == 'DAMAGED' and old.status != 'DAMAGED':
                        logger.info("Damage reported, notifying admins")
                        NotificationService.notify_damage_reported(instance)
                    
            except Assignment.DoesNotExist:
                logger.error(f"Assignment {instance.pk} not found in database")
                pass

# ========== ASSET SIGNALS ==========

@receiver(post_save, sender=Asset)
def handle_asset_notifications(sender, instance, created, **kwargs):
    """Send notifications for asset events"""
    logger.info(f"Asset signal triggered for ID: {instance.id}, Created: {created}")
    
    if created:
        logger.info(f"New asset created, notifying admins")
        NotificationService.notify_asset_created(instance, instance.created_by)