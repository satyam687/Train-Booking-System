from django.db import models
from apps.stations.models import Station

class Train(models.Model):
    train_number = models.CharField(max_length=10, unique=True, db_index=True)
    train_name = models.CharField(max_length=120, db_index=True)
    source_station = models.ForeignKey(
        Station,
        on_delete=models.CASCADE,
        related_name='departing_trains'
    )
    destination_station = models.ForeignKey(
        Station,
        on_delete=models.CASCADE,
        related_name='arriving_trains'
    )
    intermediate_stations = models.JSONField(
        default=list,
        blank=True,
        help_text="List of stations and halts in order: [{'code': 'GWL', 'name': 'Gwalior', 'halt_minutes': 5}]"
    )
    departure_time = models.TimeField()
    arrival_time = models.TimeField()
    running_days = models.JSONField(
        default=list,
        help_text="List of running days e.g. ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']"
    )
    duration_minutes = models.IntegerField(help_text="Duration in minutes")
    is_active = models.BooleanField(default=True)
    image_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text="Image URL or relative path for the train (e.g. /images/trains/vande-bharat.jpg)"
    )

    class Meta:
        ordering = ['train_number']

    def __str__(self):
        return f"{self.train_number} - {self.train_name} ({self.source_station.code} -> {self.destination_station.code})"

    @property
    def display_image_url(self):
        if self.image_url:
            return self.image_url
        name_lower = self.train_name.lower()
        if 'vande bharat' in name_lower:
            return '/images/trains/vande-bharat.jpg'
        if 'tejas' in name_lower:
            return '/images/trains/tejas.jpg'
        if 'rajdhani' in name_lower:
            return '/images/trains/rajdhani.jpg'
        if 'shatabdi' in name_lower or 'duronto' in name_lower:
            return '/images/trains/shatabdi.jpg'
        return '/images/trains/dudhsagar.jpg'


class TrainClass(models.Model):
    CLASS_CODES = (
        ('1A', 'AC First Class'),
        ('2A', 'AC 2 Tier'),
        ('3A', 'AC 3 Tier'),
        ('SL', 'Sleeper Class'),
        ('CC', 'AC Chair Car'),
        ('EC', 'Executive Chair Car'),
        ('2S', 'Second Sitting'),
    )

    train = models.ForeignKey(Train, on_delete=models.CASCADE, related_name='classes')
    class_code = models.CharField(max_length=5, choices=CLASS_CODES)
    class_name = models.CharField(max_length=50)
    base_fare = models.DecimalField(max_digits=10, decimal_places=2)
    total_seats = models.IntegerField(default=60)

    class Meta:
        unique_together = ('train', 'class_code')
        ordering = ['base_fare']

    def __str__(self):
        return f"{self.train.train_number} - {self.class_code} (Rs. {self.base_fare})"


class TrainSchedule(models.Model):
    STATUS_CHOICES = (
        ('ON_TIME', 'On Time'),
        ('DELAYED', 'Delayed'),
        ('CANCELLED', 'Cancelled'),
        ('RESCHEDULED', 'Rescheduled'),
        ('DIVERTED', 'Diverted'),
    )

    train = models.ForeignKey(Train, on_delete=models.CASCADE, related_name='schedules')
    journey_date = models.DateField(db_index=True)
    departure_datetime = models.DateTimeField()
    arrival_datetime = models.DateTimeField()
    running_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ON_TIME')
    delay_minutes = models.IntegerField(default=0)
    current_location = models.CharField(max_length=150, blank=True, default='')
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('train', 'journey_date')
        ordering = ['departure_datetime']

    def __str__(self):
        return f"{self.train.train_number} on {self.journey_date} ({self.running_status})"


class SeatInventory(models.Model):
    train_schedule = models.ForeignKey(
        TrainSchedule,
        on_delete=models.CASCADE,
        related_name='seat_inventories'
    )
    train_class = models.ForeignKey(
        TrainClass,
        on_delete=models.CASCADE,
        related_name='seat_inventories'
    )
    available_seats = models.IntegerField()
    booked_seats = models.IntegerField(default=0)
    version = models.IntegerField(default=1)  # Optimistic concurrency version lock

    class Meta:
        unique_together = ('train_schedule', 'train_class')

    def __str__(self):
        return f"{self.train_schedule.train.train_number} ({self.train_class.class_code}) - Avail: {self.available_seats}"


class LiveStatusUpdateLog(models.Model):
    train = models.ForeignKey(Train, on_delete=models.CASCADE, related_name='status_logs')
    provider = models.CharField(max_length=50)
    status_code = models.IntegerField(default=200)
    status_message = models.TextField()
    delay_minutes = models.IntegerField(default=0)
    current_station = models.CharField(max_length=100, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_simulated = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"StatusLog {self.train.train_number} [{self.timestamp}] - {self.status_message}"


class VerifiedFareRecord(models.Model):
    """
    Persisted verified fare records received from authorized railway fare APIs.
    Stores source, retrieval timestamp, journey date, travel class, currency,
    and official fare breakdown for audits and cache verification.
    """
    train_number = models.CharField(max_length=10, db_index=True)
    source_station_code = models.CharField(max_length=10, db_index=True)
    destination_station_code = models.CharField(max_length=10, db_index=True)
    journey_date = models.DateField(db_index=True)
    travel_class = models.CharField(max_length=5, db_index=True)
    quota = models.CharField(max_length=10, default='GN', db_index=True)
    passenger_count = models.IntegerField(default=1)
    currency = models.CharField(max_length=5, default='INR')

    base_fare = models.DecimalField(max_digits=10, decimal_places=2)
    reservation_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    superfast_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tatkal_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    other_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_fare = models.DecimalField(max_digits=10, decimal_places=2)

    source = models.CharField(max_length=150)
    provider_quote_id = models.CharField(max_length=120, blank=True, default='')
    raw_response = models.JSONField(default=dict, blank=True)
    retrieval_timestamp = models.DateTimeField(db_index=True)
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-retrieval_timestamp']
        indexes = [
            models.Index(fields=['train_number', 'source_station_code', 'destination_station_code', 'journey_date', 'travel_class', 'quota']),
        ]

    def __str__(self):
        return f"VerifiedFare {self.train_number} [{self.travel_class}/{self.quota}] - {self.currency} {self.total_fare} ({self.source})"
