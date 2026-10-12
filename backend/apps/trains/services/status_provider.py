import abc
import time
import random
import requests
from datetime import datetime, timezone
from django.conf import settings
from django.core.cache import cache

class BaseTrainStatusProvider(abc.ABC):
    """
    Abstract base adapter for Train Running Status providers.
    Allows seamlessly plugging in real IRCTC/Railway providers, NTES APIs, or Mock providers.
    """

    @abc.abstractmethod
    def get_live_status(self, train_number, journey_date=None):
        """
        Fetch normalized live train running status.
        Must return a dictionary conforming to the standard schema.
        """
        pass


class MockTrainStatusProvider(BaseTrainStatusProvider):
    """
    Development & fallback simulator provider.
    Clearly marks all responses as synthetic/simulated demonstration data.
    """

    def get_live_status(self, train, journey_date=None):
        now = datetime.now(timezone.utc)
        
        # Deterministic simulation based on train number and today's date
        seed_value = int(''.join(filter(str.isdigit, str(train.train_number)))) if any(c.isdigit() for c in str(train.train_number)) else 100
        random.seed(seed_value + int(now.strftime("%d%m")))

        possible_delays = [0, 0, 5, 10, 15, 25, 45, 0]
        delay = random.choice(possible_delays)
        
        if delay == 0:
            status = 'ON_TIME'
            message = 'Running on schedule with zero reported delay.'
        elif delay <= 15:
            status = 'DELAYED'
            message = f'Slight delay of {delay} mins due to caution orders.'
        else:
            status = 'DELAYED'
            message = f'Delayed by {delay} mins due to signal clearance / platform occupancy.'

        # Determine simulated current station
        stops = train.intermediate_stations if isinstance(train.intermediate_stations, list) else []
        if stops and len(stops) > 0:
            current_station = random.choice(stops).get('name', 'En Route')
        else:
            current_station = f"Approaching {train.destination_station.name}"

        return {
            'train_number': train.train_number,
            'train_name': train.train_name,
            'source_station': train.source_station.name,
            'destination_station': train.destination_station.name,
            'running_status': status,
            'delay_minutes': delay,
            'current_location': current_station,
            'last_updated': now.isoformat(),
            'provider': 'RailBook AI Simulator (Development Mode)',
            'is_simulated': True,
            'disclaimer': 'DEMO SIMULATION: This is synthetic development data, not verified official live railway information.',
            'freshness_seconds': 0
        }


class RealTrainStatusProvider(BaseTrainStatusProvider):
    """
    Adapter for real external railway API providers (e.g., RapidAPI Rail, NTES, IRCTC Partner API).
    Configured via TRAIN_API_KEY and TRAIN_API_BASE_URL.
    """

    def __init__(self):
        self.api_key = settings.TRAIN_API_KEY
        self.base_url = settings.TRAIN_API_BASE_URL
        self.timeout = 5.0

    def get_live_status(self, train, journey_date=None):
        if not self.api_key:
            raise ValueError("TRAIN_API_KEY is not configured.")

        url = f"{self.base_url}/trains/{train.train_number}/live"
        headers = {
            'Authorization': f"Bearer {self.api_key}",
            'Accept': 'application/json'
        }
        params = {}
        if journey_date:
            params['date'] = str(journey_date)

        try:
            response = requests.get(url, headers=headers, params=params, timeout=self.timeout)
            response.raise_for_isi_status() if hasattr(response, 'raise_for_isi_status') else response.raise_for_status()
            data = response.json()
            
            # Normalize third-party data format
            return {
                'train_number': train.train_number,
                'train_name': train.train_name,
                'source_station': train.source_station.name,
                'destination_station': train.destination_station.name,
                'running_status': data.get('status', 'ON_TIME'),
                'delay_minutes': int(data.get('delay_minutes', 0)),
                'current_location': data.get('current_station_name', 'En Route'),
                'last_updated': datetime.now(timezone.utc).isoformat(),
                'provider': settings.TRAIN_API_PROVIDER,
                'is_simulated': False,
                'disclaimer': 'Live external railway provider data.',
                'freshness_seconds': 0
            }
        except (requests.RequestException, ValueError) as err:
            # Fallback gracefully to mock provider if remote API fails or times out
            fallback = MockTrainStatusProvider().get_live_status(train, journey_date)
            fallback['provider_error'] = str(err)
            fallback['disclaimer'] += " (External API connection failed, degraded to simulation)."
            return fallback


class TrainStatusService:
    """
    Service layer providing cached train status lookups and refresh coordination.
    """

    @classmethod
    def get_provider(cls) -> BaseTrainStatusProvider:
        if settings.TRAIN_API_PROVIDER != 'mock' and settings.TRAIN_API_KEY:
            return RealTrainStatusProvider()
        return MockTrainStatusProvider()

    @classmethod
    def get_train_status(cls, train, journey_date=None):
        cache_key = f"train_status_{train.train_number}_{journey_date or 'today'}"
        cached = cache.get(cache_key)
        if cached:
            # Calculate freshness
            cached_copy = dict(cached)
            try:
                dt = datetime.fromisoformat(cached_copy['last_updated'])
                cached_copy['freshness_seconds'] = int((datetime.now(timezone.utc) - dt).total_seconds())
            except Exception:
                cached_copy['freshness_seconds'] = 30
            return cached_copy

        provider = cls.get_provider()
        status_data = provider.get_live_status(train, journey_date)

        # Store in cache
        cache.set(cache_key, status_data, timeout=settings.TRAIN_API_CACHE_TTL_SECONDS)
        return status_data
