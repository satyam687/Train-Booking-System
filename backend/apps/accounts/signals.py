from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        role = 'ADMIN' if instance.is_staff or instance.is_superuser else 'PASSENGER'
        UserProfile.objects.get_or_create(user=instance, defaults={'role': role})
    else:
        if hasattr(instance, 'profile'):
            if instance.is_staff and instance.profile.role != 'ADMIN':
                instance.profile.role = 'ADMIN'
                instance.profile.save()
