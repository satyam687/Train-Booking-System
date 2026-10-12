from django.db import models

class Station(models.Model):
    code = models.CharField(max_length=10, unique=True, db_index=True)
    name = models.CharField(max_length=120, db_index=True)
    city = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100)

    class Meta:
        ordering = ['code']
        verbose_name = 'Station'
        verbose_name_plural = 'Stations'

    def __str__(self):
        return f"{self.name} ({self.code})"
