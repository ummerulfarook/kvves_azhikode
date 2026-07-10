"""
Signals for members app — auto activity logging.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Member


@receiver(pre_save, sender=Member)
def track_member_status_change(sender, instance, **kwargs):
    """Track status changes before save."""
    if instance.pk:
        try:
            old = Member.objects.get(pk=instance.pk)
            instance._old_status = old.status
        except Member.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Member)
def log_member_activity(sender, instance, created, **kwargs):
    """Auto log member join or update events."""
    try:
        from apps.activities.models import ActivityLog

        if created:
            ActivityLog.objects.create(
                member=instance,
                activity_type='member_joined',
                description=f"Member {instance.member_no} - {instance.full_name} joined the organization.",
                reference_id=str(instance.id),
                reference_type='Member',
                performed_by=instance.created_by,
            )
        else:
            old_status = getattr(instance, '_old_status', None)
            if old_status and old_status != instance.status:
                ActivityLog.objects.create(
                    member=instance,
                    activity_type='status_changed',
                    description=f"Member status changed from {old_status} to {instance.status}.",
                    reference_id=str(instance.id),
                    reference_type='Member',
                )
            else:
                ActivityLog.objects.create(
                    member=instance,
                    activity_type='member_updated',
                    description=f"Member {instance.member_no} profile was updated.",
                    reference_id=str(instance.id),
                    reference_type='Member',
                )
    except Exception:
        pass  # Don't let activity logging break the main operation
