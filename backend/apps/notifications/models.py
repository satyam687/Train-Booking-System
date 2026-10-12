from django.db import models
from django.contrib.auth.models import User

class Notification(models.Model):
    TYPE_CHOICES = (
        ('BOOKING_CONFIRMED', 'Booking Confirmed'),
        ('BOOKING_CANCELLED', 'Booking Cancelled'),
        ('STATUS_UPDATE', 'Status Update'),
        ('DELAY_ALERT', 'Delay Alert'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='STATUS_UPDATE')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"
