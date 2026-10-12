import abc
import requests
from decimal import Decimal
from datetime import datetime, date, timedelta, timezone
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone as django_timezone
from apps.trains.models import Train, TrainClass, VerifiedFareRecord

class BaseRailwayFareProvider(abc.ABC):
    """
    Abstract adapter for Railway Fare API providers.
    Ensures any real authorized provider (e.g., IRCTC Enterprise Partner, Rail Fare Gateway)
    returns normalized ticket fare breakdown and currency.
    """

    @abc.abstractmethod
    def get_fare(
        self,
        train_number: str,
        source_station: str,
        destination_station: str,
        journey_date: str,
        travel_class: str,
        quota: str = 'GN',
        passenger_count: int = 1,
    ) -> dict:
        """
        Fetch authentic fare breakdown from the provider.
        Must return normalized dictionary:
        {
            'status': 'SUCCESS' | 'ERROR',
            'source': str,
            'train_number': str,
            'source_station': str,
            'destination_station': str,
            'journey_date': str,
            'travel_class': str,
            'quota': str,
            'passenger_count': int,
            'currency': 'INR',
            'base_fare': Decimal,
            'reservation_charge': Decimal,
            'superfast_charge': Decimal,
            'gst_amount': Decimal,
            'tatkal_charge': Decimal,
            'other_charges': Decimal,
            'total_fare': Decimal,
            'provider_quote_id': str,
            'raw_response': dict,
            'error_message': str (if ERROR)
        }
        """
        pass


class AuthorizedRailwayFareProvider(BaseRailwayFareProvider):
    """
    Adapter for authentic external railway fare APIs.
    Reads credentials strictly from backend configuration (never client-side).
    Complies with official API terms without scraping or unauthorized access.
    """

    def __init__(self):
        self.api_key = settings.RAILWAY_FARE_API_KEY
        self.base_url = settings.RAILWAY_FARE_API_URL.rstrip('/')
        self.provider_name = settings.RAILWAY_FARE_API_PROVIDER or 'Authorized Railway Fare Provider'
        self.timeout = 5.0

    def get_fare(
        self,
        train_number: str,
        source_station: str,
        destination_station: str,
        journey_date: str,
        travel_class: str,
        quota: str = 'GN',
        passenger_count: int = 1,
    ) -> dict:
        if not self.api_key:
            return {
                'status': 'ERROR',
                'error_message': 'RAILWAY_FARE_API_KEY is not configured in backend environment.',
                'source': self.provider_name,
            }

        url = f"{self.base_url}/fares/enquiry"
        headers = {
            'Authorization': f"Bearer {self.api_key}",
            'Accept': 'application/json',
            'User-Agent': 'RailBook-AI-AuthorizedClient/1.0',
        }
        params = {
            'train_number': str(train_number).strip(),
            'source': str(source_station).strip().upper(),
            'destination': str(destination_station).strip().upper(),
            'date': str(journey_date),
            'class': str(travel_class).strip().upper(),
            'quota': str(quota).strip().upper(),
            'passengers': int(passenger_count),
        }

        try:
            response = requests.get(url, headers=headers, params=params, timeout=self.timeout)
            if response.status_code != 200:
                try:
                    err_json = response.json()
                    msg = err_json.get('message') or err_json.get('detail') or f"Provider HTTP {response.status_code}"
                except Exception:
                    msg = f"Provider HTTP {response.status_code}: {response.text[:120]}"
                return {
                    'status': 'ERROR',
                    'error_message': msg,
                    'source': self.provider_name,
                }

            data = response.json()

            # Normalize provider response
            base_fare = Decimal(str(data.get('base_fare', 0)))
            reservation_charge = Decimal(str(data.get('reservation_charge', 0)))
            superfast_charge = Decimal(str(data.get('superfast_charge', 0)))
            gst_amount = Decimal(str(data.get('gst_amount', data.get('gst', 0))))
            tatkal_charge = Decimal(str(data.get('tatkal_charge', 0)))
            other_charges = Decimal(str(data.get('other_charges', data.get('catering_charge', 0))))

            calculated_total = (
                base_fare
                + reservation_charge
                + superfast_charge
                + gst_amount
                + tatkal_charge
                + other_charges
            )
            total_fare = Decimal(str(data.get('total_fare', calculated_total)))

            return {
                'status': 'SUCCESS',
                'source': data.get('provider_name') or self.provider_name,
                'train_number': str(train_number).strip(),
                'source_station': str(source_station).strip().upper(),
                'destination_station': str(destination_station).strip().upper(),
                'journey_date': str(journey_date),
                'travel_class': str(travel_class).strip().upper(),
                'quota': str(quota).strip().upper(),
                'passenger_count': int(passenger_count),
                'currency': data.get('currency', 'INR'),
                'base_fare': base_fare,
                'reservation_charge': reservation_charge,
                'superfast_charge': superfast_charge,
                'gst_amount': gst_amount,
                'tatkal_charge': tatkal_charge,
                'other_charges': other_charges,
                'total_fare': total_fare,
                'provider_quote_id': str(data.get('quote_id', data.get('reference_id', ''))),
                'raw_response': data,
            }

        except requests.Timeout:
            return {
                'status': 'ERROR',
                'error_message': 'Authorized railway fare provider timed out after 5.0 seconds.',
                'source': self.provider_name,
            }
        except requests.RequestException as exc:
            return {
                'status': 'ERROR',
                'error_message': f"Network error contacting railway fare provider: {str(exc)}",
                'source': self.provider_name,
            }
        except (ValueError, KeyError) as exc:
            return {
                'status': 'ERROR',
                'error_message': f"Malformed response payload from railway fare provider: {str(exc)}",
                'source': self.provider_name,
            }


class ApifyIrctcScraperProvider(BaseRailwayFareProvider):
    """
    Adapter for the scrapingshark/irctc-train-data-scraper Actor on Apify platform.
    Runs the actor in synchronous mode or using apify_client.
    Extracts authentic IRCTC fare breakdown, dynamic fares, reservation charges,
    applicable taxes, and real-time seat availability status directly from IRCTC.
    """

    def __init__(self):
        self.token = getattr(settings, 'APIFY_API_TOKEN', '')
        self.actor_id = getattr(settings, 'APIFY_ACTOR_ID', 'scrapingshark/irctc-train-data-scraper')
        self.timeout = 45.0

    def get_fare(
        self,
        train_number: str,
        source_station: str,
        destination_station: str,
        journey_date: str,
        travel_class: str,
        quota: str = 'GN',
        passenger_count: int = 1,
    ) -> dict:
        if not self.token:
            return {
                'status': 'ERROR',
                'error_message': 'APIFY_API_TOKEN is not configured in backend environment.',
                'source': f"Apify ({self.actor_id})",
            }

        # Format input schema per scrapingshark/irctc-train-data-scraper
        run_input = {
            "startingStation": str(source_station).strip().upper(),
            "destinationStation": str(destination_station).strip().upper(),
            "startDate": str(journey_date),
            "quota": str(quota).strip().upper(),
            "trainNumber": str(train_number).strip(),
            "ticketClass": str(travel_class).strip().upper(),
        }

        try:
            items = []
            try:
                from apify_client import ApifyClient
                client = ApifyClient(self.token)
                run = client.actor(self.actor_id).call(run_input=run_input, timeout_secs=int(self.timeout))
                if run and run.get("defaultDatasetId"):
                    items = list(client.dataset(run["defaultDatasetId"]).iterate_items())
            except Exception:
                # Direct Apify synchronous REST API fallback
                actor_slug = self.actor_id.replace('/', '~')
                url = f"https://api.apify.com/v2/acts/{actor_slug}/run-sync-get-dataset-items?token={self.token}"
                resp = requests.post(url, json=run_input, timeout=self.timeout)
                if resp.status_code in (200, 201):
                    items = resp.json()
                else:
                    return {
                        'status': 'ERROR',
                        'error_message': f"Apify Actor API returned HTTP {resp.status_code}: {resp.text[:140]}",
                        'source': f"Apify ({self.actor_id})",
                    }

            if not items or not isinstance(items, list):
                return {
                    'status': 'ERROR',
                    'error_message': 'No fare items returned by IRCTC Scraper Actor for this train/route.',
                    'source': f"Apify ({self.actor_id})",
                }

            # Find matching fare detail item
            fare_item = None
            for it in items:
                if (
                    str(it.get('trainNo') or it.get('trainNumber', '')).strip() == str(train_number).strip()
                    or 'baseFare' in it
                    or 'totalFare' in it
                ):
                    fare_item = it
                    break
            if not fare_item:
                fare_item = items[0]

            base_fare = Decimal(str(fare_item.get('baseFare', 0)))
            reservation_charge = Decimal(str(fare_item.get('reservationCharge', 0)))
            superfast_charge = Decimal(str(fare_item.get('superfastCharge', 0)))
            gst_amount = Decimal(str(fare_item.get('serviceTax', 0.0)))
            tatkal_charge = Decimal(str(fare_item.get('tatkalFare', 0)))
            other_charges = (
                Decimal(str(fare_item.get('otherCharge', 0)))
                + Decimal(str(fare_item.get('cateringCharge', 0)))
                + Decimal(str(fare_item.get('dynamicFare', 0)))
            )

            total_val = fare_item.get('totalCollectibleAmount') or fare_item.get('totalFare')
            if total_val is not None:
                total_fare = Decimal(str(total_val))
            else:
                total_fare = base_fare + reservation_charge + superfast_charge + gst_amount + tatkal_charge + other_charges

            pax = max(1, int(passenger_count))
            total_fare_for_pax = total_fare * pax

            return {
                'status': 'SUCCESS',
                'source': f"IRCTC Portal via Apify ({self.actor_id})",
                'train_number': str(train_number).strip(),
                'source_station': str(source_station).strip().upper(),
                'destination_station': str(destination_station).strip().upper(),
                'journey_date': str(journey_date),
                'travel_class': str(travel_class).strip().upper(),
                'quota': str(quota).strip().upper(),
                'passenger_count': pax,
                'currency': 'INR',
                'base_fare': base_fare * pax,
                'reservation_charge': reservation_charge * pax,
                'superfast_charge': superfast_charge * pax,
                'gst_amount': gst_amount * pax,
                'tatkal_charge': tatkal_charge * pax,
                'other_charges': other_charges * pax,
                'total_fare': total_fare_for_pax,
                'provider_quote_id': f"APIFY-{fare_item.get('reqEnqParam', 'IRCTC')}",
                'availability_status': fare_item.get('availablityStatus', ''),
                'raw_response': fare_item,
            }

        except Exception as exc:
            return {
                'status': 'ERROR',
                'error_message': f"Error contacting Apify IRCTC Actor: {str(exc)}",
                'source': f"Apify ({self.actor_id})",
            }


class FareService:
    """
    Central Fare Service managing authorized provider retrieval, caching,
    SQLite persistence of verified quotes, and pre-booking revalidation.
    """

    UNCONFIGURED_MESSAGE = "Fare unavailable — connect an authorized fare provider."

    @classmethod
    def is_provider_configured(cls) -> bool:
        """
        Returns True if either:
        1. APIFY_API_TOKEN is configured (uses scrapingshark/irctc-train-data-scraper actor), OR
        2. RAILWAY_FARE_API_KEY and RAILWAY_FARE_API_PROVIDER are configured.
        """
        has_apify = bool(getattr(settings, 'APIFY_API_TOKEN', None))
        has_direct_api = bool(
            getattr(settings, 'RAILWAY_FARE_API_KEY', None)
            and getattr(settings, 'RAILWAY_FARE_API_PROVIDER', None)
        )
        return has_apify or has_direct_api

    @classmethod
    def get_provider(cls) -> BaseRailwayFareProvider:
        if getattr(settings, 'APIFY_API_TOKEN', None):
            return ApifyIrctcScraperProvider()
        return AuthorizedRailwayFareProvider()

    @classmethod
    def get_demo_fare(cls, train_number: str, travel_class: str, passenger_count: int = 1) -> dict:
        """
        Retrieves benchmark tariff from local demo database.
        Strictly labeled so demo numbers are never presented as authentic verified fares.
        """
        train_class = TrainClass.objects.filter(
            train__train_number=train_number,
            class_code=travel_class
        ).first()

        if not train_class:
            return None

        base = Decimal(str(train_class.base_fare))
        sf = Decimal('45.00') if travel_class in ['1A', '2A', '3A', 'CC', 'EC'] else Decimal('30.00')
        res_map = {'1A': Decimal('60.00'), 'EC': Decimal('60.00'), '2A': Decimal('50.00'), '3A': Decimal('40.00'), 'CC': Decimal('40.00'), 'SL': Decimal('20.00'), '2S': Decimal('15.00')}
        res = res_map.get(travel_class, Decimal('30.00'))
        gst = (base * Decimal('0.05')).quantize(Decimal('0.01')) if travel_class in ['1A', '2A', '3A', 'CC', 'EC'] else Decimal('0.00')
        single_total = base + sf + res + gst
        count = Decimal(str(max(1, passenger_count)))

        return {
            'is_demo': True,
            'label': 'Demo Benchmark Tariff (Unverified)',
            'disclaimer': 'DEMO SIMULATION: This is unverified benchmark tariff data for development purposes only. Connect an authorized railway fare provider for official ticket prices.',
            'currency': 'INR',
            'base_fare': float(base * count),
            'reservation_charge': float(sf * count),
            'superfast_charge': float(res * count),
            'gst_amount': float(gst * count),
            'total_fare': float(single_total * count),
            'passenger_count': passenger_count,
        }

    @classmethod
    def get_fare(
        cls,
        train_number: str,
        source_station: str,
        destination_station: str,
        journey_date: str,
        travel_class: str,
        quota: str = 'GN',
        passenger_count: int = 1,
        force_refresh: bool = False,
    ) -> dict:
        """
        Retrieve authentic ticket fare.
        - If provider unconfigured: returns 'UNAVAILABLE' status and message.
        - If cached and fresh: returns cached verified fare.
        - If stale or uncached: queries provider and persists in SQLite3.
        """
        t_num = str(train_number).strip()
        src = str(source_station).strip().upper()
        dst = str(destination_station).strip().upper()
        j_date = str(journey_date)
        t_cls = str(travel_class).strip().upper()
        qta = str(quota).strip().upper()
        pax = max(1, int(passenger_count))

        # Check configuration
        if not cls.is_provider_configured():
            demo_fare = cls.get_demo_fare(t_num, t_cls, pax)
            return {
                'fare_status': 'UNAVAILABLE',
                'is_verified': False,
                'detail': cls.UNCONFIGURED_MESSAGE,
                'train_number': t_num,
                'source_station': src,
                'destination_station': dst,
                'journey_date': j_date,
                'travel_class': t_cls,
                'quota': qta,
                'passenger_count': pax,
                'currency': 'INR',
                'verified_fare': None,
                'demo_fare': demo_fare,
            }

        ttl_minutes = getattr(settings, 'FARE_CACHE_TTL_MINUTES', 60)
        cache_key = f"railway_verified_fare_{t_num}_{src}_{dst}_{j_date}_{t_cls}_{qta}_{pax}"

        # 1. Check in-memory/Redis Django cache
        if not force_refresh:
            cached_data = cache.get(cache_key)
            if cached_data:
                cached_copy = dict(cached_data)
                cached_copy['from_cache'] = True
                return cached_copy

            # 2. Check SQLite3 database for recent verified fare record within TTL
            cutoff_time = django_timezone.now() - timedelta(minutes=ttl_minutes)
            recent_db_record = VerifiedFareRecord.objects.filter(
                train_number=t_num,
                source_station_code=src,
                destination_station_code=dst,
                journey_date=j_date,
                travel_class=t_cls,
                quota=qta,
                passenger_count=pax,
                retrieval_timestamp__gte=cutoff_time,
                is_verified=True,
            ).order_by('-retrieval_timestamp').first()

            if recent_db_record:
                verified_payload = cls._format_verified_response(recent_db_record, from_cache=True)
                cache.set(cache_key, verified_payload, timeout=ttl_minutes * 60)
                return verified_payload

        # 3. Query External Authorized Provider
        provider = cls.get_provider()
        provider_resp = provider.get_fare(
            train_number=t_num,
            source_station=src,
            destination_station=dst,
            journey_date=j_date,
            travel_class=t_cls,
            quota=qta,
            passenger_count=pax,
        )

        if provider_resp.get('status') != 'SUCCESS':
            return {
                'fare_status': 'PROVIDER_ERROR',
                'is_verified': False,
                'detail': provider_resp.get('error_message', 'External railway fare provider request failed.'),
                'source': provider_resp.get('source', 'Authorized Provider'),
                'train_number': t_num,
                'source_station': src,
                'destination_station': dst,
                'journey_date': j_date,
                'travel_class': t_cls,
                'quota': qta,
                'passenger_count': pax,
                'currency': 'INR',
                'verified_fare': None,
                'demo_fare': cls.get_demo_fare(t_num, t_cls, pax),
            }

        # 4. Save Verified Response into SQLite3
        now = django_timezone.now()
        record = VerifiedFareRecord.objects.create(
            train_number=t_num,
            source_station_code=src,
            destination_station_code=dst,
            journey_date=j_date,
            travel_class=t_cls,
            quota=qta,
            passenger_count=pax,
            currency=provider_resp.get('currency', 'INR'),
            base_fare=provider_resp['base_fare'],
            reservation_charge=provider_resp['reservation_charge'],
            superfast_charge=provider_resp['superfast_charge'],
            gst_amount=provider_resp['gst_amount'],
            tatkal_charge=provider_resp['tatkal_charge'],
            other_charges=provider_resp['other_charges'],
            total_fare=provider_resp['total_fare'],
            source=provider_resp.get('source', settings.RAILWAY_FARE_API_PROVIDER),
            provider_quote_id=provider_resp.get('provider_quote_id', ''),
            raw_response=provider_resp.get('raw_response', {}),
            retrieval_timestamp=now,
            is_verified=True,
        )

        verified_payload = cls._format_verified_response(record, from_cache=False)
        cache.set(cache_key, verified_payload, timeout=ttl_minutes * 60)
        return verified_payload

    @classmethod
    def revalidate_quote_before_booking(
        cls,
        train_number: str,
        source_station: str,
        destination_station: str,
        journey_date: str,
        travel_class: str,
        expected_total_fare: Decimal,
        quota: str = 'GN',
        passenger_count: int = 1,
    ) -> dict:
        """
        Revalidates fares prior to creating a booking.
        Checks for expired quotes or price changes from the railway provider.
        """
        if not cls.is_provider_configured():
            return {
                'is_valid': True,
                'is_verified': False,
                'notice': 'Provider not configured: Booking processed under demonstration sandbox terms.',
            }

        latest_fare = cls.get_fare(
            train_number=train_number,
            source_station=source_station,
            destination_station=destination_station,
            journey_date=journey_date,
            travel_class=travel_class,
            quota=quota,
            passenger_count=passenger_count,
            force_refresh=True,
        )

        if latest_fare.get('fare_status') != 'VERIFIED':
            return {
                'is_valid': False,
                'reason': 'PROVIDER_ERROR',
                'detail': latest_fare.get('detail', 'Unable to revalidate ticket fare with provider before booking.'),
            }

        verified_info = latest_fare['verified_fare']
        current_price = Decimal(str(verified_info['total_fare']))
        expected_dec = Decimal(str(expected_total_fare))

        if current_price != expected_dec:
            return {
                'is_valid': False,
                'reason': 'FARE_CHANGED',
                'expected_fare': float(expected_dec),
                'new_fare': float(current_price),
                'currency': verified_info.get('currency', 'INR'),
                'detail': f"Fare has changed from ₹{expected_dec} to ₹{current_price}. Please review the updated verified fare.",
                'updated_quote': latest_fare,
            }

        return {
            'is_valid': True,
            'is_verified': True,
            'verified_fare': verified_info,
        }

    @classmethod
    def _format_verified_response(cls, record: VerifiedFareRecord, from_cache: bool = False) -> dict:
        age_seconds = int((django_timezone.now() - record.retrieval_timestamp).total_seconds())
        return {
            'fare_status': 'VERIFIED',
            'is_verified': True,
            'from_cache': from_cache,
            'train_number': record.train_number,
            'source_station': record.source_station_code,
            'destination_station': record.destination_station_code,
            'journey_date': str(record.journey_date),
            'travel_class': record.travel_class,
            'quota': record.quota,
            'passenger_count': record.passenger_count,
            'currency': record.currency,
            'source': record.source,
            'retrieval_timestamp': record.retrieval_timestamp.isoformat(),
            'freshness_seconds': age_seconds,
            'verified_fare': {
                'currency': record.currency,
                'currency_symbol': '₹',
                'base_fare': float(record.base_fare),
                'reservation_charge': float(record.reservation_charge),
                'superfast_charge': float(record.superfast_charge),
                'gst_amount': float(record.gst_amount),
                'tatkal_charge': float(record.tatkal_charge),
                'other_charges': float(record.other_charges),
                'total_fare': float(record.total_fare),
                'provider_quote_id': record.provider_quote_id,
                'source': record.source,
                'retrieval_timestamp': record.retrieval_timestamp.isoformat(),
            },
            'demo_fare': None,
        }
