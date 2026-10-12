from django.db import models
from django.contrib.auth.models import User
from apps.trains.models import TrainSchedule, TrainClass

class Booking(models.Model):
    BOOKING_STATUS_CHOICES = (
        ('PENDING', 'Pending Payment'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('REFUNDED', 'Refunded'),
        ('FAILED', 'Failed'),
    )

    booking_reference = models.CharField(max_length=24, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    train_schedule = models.ForeignKey(TrainSchedule, on_delete=models.CASCADE, related_name='bookings')
    train_class = models.ForeignKey(TrainClass, on_delete=models.CASCADE, related_name='bookings')
    journey_date = models.DateField(db_index=True)
    passenger_count = models.IntegerField(default=1)
    base_fare_per_passenger = models.DecimalField(max_digits=10, decimal_places=2)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_fare = models.DecimalField(max_digits=10, decimal_places=2)
    booking_status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='PENDING')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking_reference} - {self.user.username} ({self.booking_status})"


class Passenger(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='passengers')
    full_name = models.CharField(max_length=120)
    age = models.IntegerField()
    gender = models.CharField(max_length=5, choices=GENDER_CHOICES)
    seat_number = models.CharField(max_length=20, null=True, blank=True)
    berth_preference = models.CharField(max_length=30, blank=True, default='No Preference')

    def __str__(self):
        return f"{self.full_name} ({self.seat_number or 'Unassigned'})"
