from django.db import models

class DemandPredictionRecord(models.Model):
    train_number = models.CharField(max_length=10)
    route = models.CharField(max_length=50)
    travel_class = models.CharField(max_length=10)
    journey_date = models.DateField()
    predicted_demand = models.FloatField()
    demand_level = models.CharField(max_length=20)
    model_version = models.CharField(max_length=50, default='v1.2-randomforest')
    is_synthetic = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.train_number} ({self.journey_date}) -> {self.predicted_demand}% [{self.demand_level}]"
