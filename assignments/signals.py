from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Assignment, AssignmentHistory

@receiver(pre_save, sender=Assignment)
def track_status_change(sender, instance, **kwargs):
    """Track when assignment status changes"""
    if instance.pk:
        try:
            old_instance = Assignment.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                # Status changed, will be handled by the view
                pass
        except Assignment.DoesNotExist:
            pass

@receiver(post_save, sender=Assignment)
def update_asset_on_assignment(sender, instance, created, **kwargs):
    """Update asset status when assignment changes"""
    if created:
        # Already handled in save method
        pass
    else:
        # Check if status changed to returned
        if instance.status == Assignment.AssignmentStatus.RETURNED:
            instance.asset.status = 'AVAILABLE'
            instance.asset.save()