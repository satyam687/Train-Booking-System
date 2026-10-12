from django.core.management.base import BaseCommand
from datetime import date
from apps.trains.models import Train, LiveStatusUpdateLog, TrainSchedule
from apps.trains.services.status_provider import TrainStatusService

class Command(BaseCommand):
    help = "Refreshes live train statuses from configured provider (or simulation) and updates schedules."

    def handle(self, *args, **options):
        self.stdout.write("Refreshing live train running statuses...")
        trains = Train.objects.filter(is_active=True)
        today = date.today()
        refreshed_count = 0

        for train in trains:
            status_data = TrainStatusService.get_train_status(train, today)
            delay = status_data.get('delay_minutes', 0)
            status_val = status_data.get('running_status', 'ON_TIME')
            location = status_data.get('current_location', '')

            # Update schedule for today if exists
            schedule = TrainSchedule.objects.filter(train=train, journey_date=today).first()
            if schedule:
                schedule.running_status = status_val
                schedule.delay_minutes = delay
                schedule.current_location = location
                schedule.save()

            # Record log
            LiveStatusUpdateLog.objects.create(
                train=train,
                provider=status_data.get('provider', 'MockProvider'),
                status_code=200,
                status_message=f"Status: {status_val}, Delay: {delay} mins. Location: {location}",
                delay_minutes=delay,
                current_station=location,
                is_simulated=status_data.get('is_simulated', True)
            )
            refreshed_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully refreshed status for {refreshed_count} trains."))
