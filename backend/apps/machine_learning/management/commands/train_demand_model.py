from django.core.management.base import BaseCommand
from ml.train_demand_model import train_demand_model

class Command(BaseCommand):
    help = "Trains the Ticket Demand Prediction RandomForestRegressor model and saves artifacts."

    def handle(self, *args, **options):
        self.stdout.write("Starting demand model training pipeline...")
        metrics = train_demand_model()
        self.stdout.write(self.style.SUCCESS(
            f"Model successfully trained! MAE: {metrics['metrics']['mae']}%, R2: {metrics['metrics']['r2_score']}"
        ))
