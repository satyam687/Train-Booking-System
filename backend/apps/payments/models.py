from django.db import models
from apps.bookings.models import Booking

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('UPI', 'Unified Payments Interface (UPI)'),
        ('CREDIT_CARD', 'Credit Card (Demo)'),
        ('DEBIT_CARD', 'Debit Card (Demo)'),
        ('NET_BANKING', 'Internet Banking (Demo)'),
        ('WALLET', 'Digital Wallet (Demo)'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('SUCCESS', 'Success'),
        ('PENDING', 'Pending'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, default='UPI')
    transaction_reference = models.CharField(max_length=64, unique=True, db_index=True)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='SUCCESS')
    is_demo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_reference} - {self.booking.booking_reference} ({self.payment_status})"
