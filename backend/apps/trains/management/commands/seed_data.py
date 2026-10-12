import uuid
import random
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from apps.accounts.models import UserProfile
from apps.stations.models import Station
from apps.trains.models import Train, TrainClass, TrainSchedule, SeatInventory
from apps.bookings.models import Booking, Passenger
from apps.payments.models import Payment
from apps.machine_learning.models import DemandPredictionRecord

class Command(BaseCommand):
    help = "Seeds database with comprehensive railway demo data (stations, trains, schedules, classes, bookings, users)."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting RailBook AI database seeding..."))

        # 1. Create or ensure Default Users
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@railbook.ai',
                'first_name': 'System',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Created demo admin: admin / admin123"))

        admin_profile, _ = UserProfile.objects.get_or_create(user=admin_user)
        admin_profile.role = 'ADMIN'
        admin_profile.phone = '+91 98765 43210'
        admin_profile.save()

        passenger_user, p_created = User.objects.get_or_create(
            username='passenger',
            defaults={
                'email': 'passenger@railbook.ai',
                'first_name': 'Rahul',
                'last_name': 'Sharma',
                'is_staff': False,
                'is_superuser': False
            }
        )
        if p_created:
            passenger_user.set_password('pass123')
            passenger_user.save()
            self.stdout.write(self.style.SUCCESS("Created demo passenger: passenger / pass123"))

        p_profile, _ = UserProfile.objects.get_or_create(user=passenger_user)
        p_profile.role = 'PASSENGER'
        p_profile.phone = '+91 91234 56789'
        p_profile.save()

        # 2. Seed 25+ Stations
        stations_data = [
            {'code': 'NDLS', 'name': 'New Delhi', 'city': 'New Delhi', 'state': 'Delhi'},
            {'code': 'MMCT', 'name': 'Mumbai Central', 'city': 'Mumbai', 'state': 'Maharashtra'},
            {'code': 'CSMT', 'name': 'Chhatrapati Shivaji Maharaj Terminus', 'city': 'Mumbai', 'state': 'Maharashtra'},
            {'code': 'HWH', 'name': 'Howrah Junction', 'city': 'Kolkata', 'state': 'West Bengal'},
            {'code': 'MAS', 'name': 'Puratchi Thalaivar Dr. M.G.R. Chennai Central', 'city': 'Chennai', 'state': 'Tamil Nadu'},
            {'code': 'SBC', 'name': 'KSR Bengaluru City', 'city': 'Bengaluru', 'state': 'Karnataka'},
            {'code': 'BSB', 'name': 'Varanasi Junction', 'city': 'Varanasi', 'state': 'Uttar Pradesh'},
            {'code': 'LKO', 'name': 'Lucknow Charbagh', 'city': 'Lucknow', 'state': 'Uttar Pradesh'},
            {'code': 'PNBE', 'name': 'Patna Junction', 'city': 'Patna', 'state': 'Bihar'},
            {'code': 'ADI', 'name': 'Ahmedabad Junction', 'city': 'Ahmedabad', 'state': 'Gujarat'},
            {'code': 'JP', 'name': 'Jaipur Junction', 'city': 'Jaipur', 'state': 'Rajasthan'},
            {'code': 'PUNE', 'name': 'Pune Junction', 'city': 'Pune', 'state': 'Maharashtra'},
            {'code': 'HYB', 'name': 'Hyderabad Deccan', 'city': 'Hyderabad', 'state': 'Telangana'},
            {'code': 'SC', 'name': 'Secunderabad Junction', 'city': 'Secunderabad', 'state': 'Telangana'},
            {'code': 'GKP', 'name': 'Gorakhpur Junction', 'city': 'Gorakhpur', 'state': 'Uttar Pradesh'},
            {'code': 'CNB', 'name': 'Kanpur Central', 'city': 'Kanpur', 'state': 'Uttar Pradesh'},
            {'code': 'AGC', 'name': 'Agra Cantt', 'city': 'Agra', 'state': 'Uttar Pradesh'},
            {'code': 'GWL', 'name': 'Gwalior Junction', 'city': 'Gwalior', 'state': 'Madhya Pradesh'},
            {'code': 'NGP', 'name': 'Nagpur Junction', 'city': 'Nagpur', 'state': 'Maharashtra'},
            {'code': 'BZA', 'name': 'Vijayawada Junction', 'city': 'Vijayawada', 'state': 'Andhra Pradesh'},
            {'code': 'CDG', 'name': 'Chandigarh Junction', 'city': 'Chandigarh', 'state': 'Punjab/Haryana'},
            {'code': 'ASR', 'name': 'Amritsar Junction', 'city': 'Amritsar', 'state': 'Punjab'},
            {'code': 'TVC', 'name': 'Thiruvananthapuram Central', 'city': 'Thiruvananthapuram', 'state': 'Kerala'},
            {'code': 'ERS', 'name': 'Ernakulam Junction', 'city': 'Kochi', 'state': 'Kerala'},
            {'code': 'BPL', 'name': 'Bhopal Junction', 'city': 'Bhopal', 'state': 'Madhya Pradesh'},
            {'code': 'R', 'name': 'Raipur Junction', 'city': 'Raipur', 'state': 'Chhattisgarh'},
        ]

        station_objs = {}
        for s in stations_data:
            obj, _ = Station.objects.get_or_create(code=s['code'], defaults=s)
            station_objs[s['code']] = obj

        self.stdout.write(self.style.SUCCESS(f"Seeded {len(station_objs)} stations."))

        # 3. Seed 32 Trains
        trains_data = [
            # Delhi - Mumbai corridor
            {'number': '12952', 'name': 'Mumbai Rajdhani Express', 'src': 'NDLS', 'dest': 'MMCT', 'dep': time(16, 55), 'arr': time(8, 35), 'dur': 940, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12951', 'name': 'New Delhi Rajdhani Express', 'src': 'MMCT', 'dest': 'NDLS', 'dep': time(17, 0), 'arr': time(8, 32), 'dur': 932, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12953', 'name': 'August Kranti Tejas Rajdhani', 'src': 'MMCT', 'dest': 'NDLS', 'dep': time(17, 10), 'arr': time(9, 43), 'dur': 993, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12954', 'name': 'August Kranti Tejas Rajdhani', 'src': 'NDLS', 'dest': 'MMCT', 'dep': time(17, 15), 'arr': time(10, 5), 'dur': 1010, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '22221', 'name': 'CSMT Rajdhani Express', 'src': 'CSMT', 'dest': 'NDLS', 'dep': time(16, 0), 'arr': time(9, 55), 'dur': 1075, 'days': ["MON","WED","FRI","SUN"]},
            {'number': '22222', 'name': 'Mumbai CSMT Rajdhani Express', 'src': 'NDLS', 'dest': 'CSMT', 'dep': time(16, 55), 'arr': time(11, 15), 'dur': 1100, 'days': ["MON","TUE","THU","SAT"]},

            # Delhi - Kolkata corridor
            {'number': '12301', 'name': 'Howrah Rajdhani Express', 'src': 'HWH', 'dest': 'NDLS', 'dep': time(16, 50), 'arr': time(10, 5), 'dur': 1035, 'days': ["MON","TUE","WED","THU","FRI","SAT"]},
            {'number': '12302', 'name': 'New Delhi Howrah Rajdhani', 'src': 'NDLS', 'dest': 'HWH', 'dep': time(16, 50), 'arr': time(9, 55), 'dur': 1025, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12260', 'name': 'Sealdah AC Duronto Express', 'src': 'NDLS', 'dest': 'HWH', 'dep': time(19, 45), 'arr': time(12, 45), 'dur': 1020, 'days': ["MON","TUE","THU","FRI"]},

            # Vande Bharat Routes
            {'number': '22436', 'name': 'Vande Bharat Express (Varanasi)', 'src': 'NDLS', 'dest': 'BSB', 'dep': time(6, 0), 'arr': time(14, 0), 'dur': 480, 'days': ["TUE","WED","FRI","SAT","SUN"]},
            {'number': '22435', 'name': 'Vande Bharat Express (New Delhi)', 'src': 'BSB', 'dest': 'NDLS', 'dep': time(15, 0), 'arr': time(23, 0), 'dur': 480, 'days': ["TUE","WED","FRI","SAT","SUN"]},
            {'number': '20901', 'name': 'Vande Bharat Express (Gandhinagar)', 'src': 'MMCT', 'dest': 'ADI', 'dep': time(6, 10), 'arr': time(11, 25), 'dur': 315, 'days': ["MON","TUE","WED","THU","FRI","SAT"]},
            {'number': '20902', 'name': 'Vande Bharat Express (Mumbai)', 'src': 'ADI', 'dest': 'MMCT', 'dep': time(14, 45), 'arr': time(20, 15), 'dur': 330, 'days': ["MON","TUE","WED","THU","FRI","SAT"]},
            {'number': '20607', 'name': 'Vande Bharat Express (Mysuru)', 'src': 'MAS', 'dest': 'SBC', 'dep': time(5, 50), 'arr': time(10, 15), 'dur': 265, 'days': ["MON","TUE","THU","FRI","SAT","SUN"]},
            {'number': '20608', 'name': 'Vande Bharat Express (Chennai)', 'src': 'SBC', 'dest': 'MAS', 'dep': time(14, 50), 'arr': time(19, 20), 'dur': 270, 'days': ["MON","TUE","THU","FRI","SAT","SUN"]},

            # Delhi - Lucknow / Kanpur
            {'number': '12004', 'name': 'Lucknow Swarna Shatabdi', 'src': 'NDLS', 'dest': 'LKO', 'dep': time(6, 10), 'arr': time(12, 40), 'dur': 390, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12003', 'name': 'New Delhi Shatabdi Express', 'src': 'LKO', 'dest': 'NDLS', 'dep': time(15, 30), 'arr': time(22, 20), 'dur': 410, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12015', 'name': 'Ajmer Shatabdi Express', 'src': 'NDLS', 'dest': 'JP', 'dep': time(6, 10), 'arr': time(10, 40), 'dur': 270, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12016', 'name': 'New Delhi Shatabdi Express', 'src': 'JP', 'dest': 'NDLS', 'dep': time(17, 50), 'arr': time(22, 30), 'dur': 280, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},

            # South routes (Bengaluru - Chennai - Hyderabad)
            {'number': '12626', 'name': 'Kerala Superfast Express', 'src': 'NDLS', 'dest': 'TVC', 'dep': time(20, 10), 'arr': time(22, 10), 'dur': 2940, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12608', 'name': 'Lalbagh SF Express', 'src': 'SBC', 'dest': 'MAS', 'dep': time(6, 20), 'arr': time(12, 15), 'dur': 355, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12607', 'name': 'Lalbagh SF Express', 'src': 'MAS', 'dest': 'SBC', 'dep': time(15, 30), 'arr': time(21, 35), 'dur': 365, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12724', 'name': 'Telangana Express', 'src': 'NDLS', 'dest': 'HYB', 'dep': time(16, 0), 'arr': time(18, 50), 'dur': 1610, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12723', 'name': 'Telangana Express', 'src': 'HYB', 'dest': 'NDLS', 'dep': time(6, 0), 'arr': time(7, 40), 'dur': 1540, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},

            # Mumbai - Pune / Ahmedabad
            {'number': '12123', 'name': 'Deccan Queen Superfast', 'src': 'CSMT', 'dest': 'PUNE', 'dep': time(17, 10), 'arr': time(20, 25), 'dur': 195, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12124', 'name': 'Deccan Queen Superfast', 'src': 'PUNE', 'dest': 'CSMT', 'dep': time(7, 15), 'arr': time(10, 25), 'dur': 190, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12931', 'name': 'Double Decker Express', 'src': 'MMCT', 'dest': 'ADI', 'dep': time(14, 30), 'arr': time(21, 25), 'dur': 415, 'days': ["MON","TUE","WED","THU","FRI","SAT"]},
            {'number': '12932', 'name': 'Double Decker Express', 'src': 'ADI', 'dest': 'MMCT', 'dep': time(5, 55), 'arr': time(13, 5), 'dur': 430, 'days': ["MON","TUE","WED","THU","FRI","SAT"]},

            # Bihar & East
            {'number': '12393', 'name': 'Sampoorna Kranti Express', 'src': 'PNBE', 'dest': 'NDLS', 'dep': time(19, 25), 'arr': time(7, 55), 'dur': 750, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12394', 'name': 'Sampoorna Kranti Express', 'src': 'NDLS', 'dest': 'PNBE', 'dep': time(17, 30), 'arr': time(6, 50), 'dur': 800, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12417', 'name': 'Prayagraj Express', 'src': 'NDLS', 'dest': 'CNB', 'dep': time(22, 10), 'arr': time(4, 30), 'dur': 380, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
            {'number': '12418', 'name': 'Prayagraj Express', 'src': 'CNB', 'dest': 'NDLS', 'dep': time(23, 55), 'arr': time(7, 0), 'dur': 425, 'days': ["MON","TUE","WED","THU","FRI","SAT","SUN"]},
        ]

        # Standard class configs based on train type
        class_configs = {
            'Rajdhani': [
                ('1A', 'AC First Class', Decimal('4450.00'), 24),
                ('2A', 'AC 2 Tier', Decimal('2680.00'), 54),
                ('3A', 'AC 3 Tier', Decimal('1920.00'), 72),
            ],
            'Vande Bharat': [
                ('EC', 'Executive Chair Car', Decimal('2250.00'), 52),
                ('CC', 'AC Chair Car', Decimal('1280.00'), 78),
            ],
            'Shatabdi': [
                ('EC', 'Executive Chair Car', Decimal('1850.00'), 50),
                ('CC', 'AC Chair Car', Decimal('980.00'), 78),
            ],
            'Superfast': [
                ('2A', 'AC 2 Tier', Decimal('2100.00'), 48),
                ('3A', 'AC 3 Tier', Decimal('1450.00'), 64),
                ('SL', 'Sleeper Class', Decimal('580.00'), 72),
                ('2S', 'Second Sitting', Decimal('280.00'), 90),
            ],
            'Chair': [
                ('CC', 'AC Chair Car', Decimal('450.00'), 78),
                ('2S', 'Second Sitting', Decimal('160.00'), 100),
            ]
        }

        created_train_count = 0
        today = date.today()

        for t_data in trains_data:
            src = station_objs.get(t_data['src'])
            dest = station_objs.get(t_data['dest'])
            if not src or not dest:
                continue

            # Intermediate stations halts
            halts = [
                {'code': 'AGC', 'name': 'Agra Cantt', 'halt_minutes': 5},
                {'code': 'GWL', 'name': 'Gwalior', 'halt_minutes': 3},
                {'code': 'BPL', 'name': 'Bhopal', 'halt_minutes': 5},
                {'code': 'NGP', 'name': 'Nagpur', 'halt_minutes': 8},
            ]

            train, _ = Train.objects.get_or_create(
                train_number=t_data['number'],
                defaults={
                    'train_name': t_data['name'],
                    'source_station': src,
                    'destination_station': dest,
                    'intermediate_stations': halts,
                    'departure_time': t_data['dep'],
                    'arrival_time': t_data['arr'],
                    'running_days': t_data['days'],
                    'duration_minutes': t_data['dur'],
                    'is_active': True
                }
            )
            created_train_count += 1

            # Determine train class category
            if 'Rajdhani' in train.train_name:
                configs = class_configs['Rajdhani']
            elif 'Vande Bharat' in train.train_name:
                configs = class_configs['Vande Bharat']
            elif 'Shatabdi' in train.train_name:
                configs = class_configs['Shatabdi']
            elif 'Queen' in train.train_name or 'Decker' in train.train_name:
                configs = class_configs['Chair']
            else:
                configs = class_configs['Superfast']

            train_classes = []
            for code, name, base_fare, seats in configs:
                tc, _ = TrainClass.objects.get_or_create(
                    train=train,
                    class_code=code,
                    defaults={
                        'class_name': name,
                        'base_fare': base_fare,
                        'total_seats': seats
                    }
                )
                train_classes.append(tc)

            # Seed schedules for next 21 days
            for d_offset in range(21):
                j_date = today + timedelta(days=d_offset)
                dep_dt = datetime.combine(j_date, train.departure_time)
                arr_dt = dep_dt + timedelta(minutes=train.duration_minutes)

                schedule, _ = TrainSchedule.objects.get_or_create(
                    train=train,
                    journey_date=j_date,
                    defaults={
                        'departure_datetime': timezone.make_aware(dep_dt) if timezone.is_naive(dep_dt) else dep_dt,
                        'arrival_datetime': timezone.make_aware(arr_dt) if timezone.is_naive(arr_dt) else arr_dt,
                        'running_status': 'ON_TIME',
                        'delay_minutes': 0,
                        'current_location': f"Scheduled at {train.source_station.name}"
                    }
                )

                # Seed seat inventories
                for tc in train_classes:
                    # Deterministic available seats
                    booked = min(tc.total_seats - 8, max(5, (d_offset * 2 + tc.total_seats // 3) % tc.total_seats))
                    avail = tc.total_seats - booked
                    SeatInventory.objects.get_or_create(
                        train_schedule=schedule,
                        train_class=tc,
                        defaults={
                            'available_seats': avail,
                            'booked_seats': booked,
                            'version': 1
                        }
                    )

        self.stdout.write(self.style.SUCCESS(f"Seeded {created_train_count} trains with classes, schedules, and inventories."))

        # 4. Seed Sample Bookings for demonstration & dashboard analytics
        if Booking.objects.count() < 10:
            sample_schedules = TrainSchedule.objects.select_related('train').all()[:12]
            for i, sch in enumerate(sample_schedules):
                tc = sch.train.classes.first()
                if not tc:
                    continue

                ref = f"RB-{sch.train.train_number}-{uuid.uuid4().hex[:6].upper()}"
                b_date = today - timedelta(days=(i % 6))
                booking = Booking.objects.create(
                    booking_reference=ref,
                    user=passenger_user,
                    train_schedule=sch,
                    train_class=tc,
                    journey_date=sch.journey_date,
                    passenger_count=2,
                    base_fare_per_passenger=tc.base_fare,
                    service_fee=Decimal('25.00'),
                    total_fare=(tc.base_fare * 2) + Decimal('25.00'),
                    booking_status='CONFIRMED' if i % 4 != 0 else 'PENDING',
                    payment_status='PAID' if i % 4 != 0 else 'PENDING',
                )
                booking.created_at = timezone.now() - timedelta(days=(i % 6), hours=i)
                booking.save()

                Passenger.objects.create(
                    booking=booking,
                    full_name='Rahul Sharma',
                    age=32,
                    gender='M',
                    seat_number=f"B1-{10 + i}",
                    berth_preference='Lower'
                )
                Passenger.objects.create(
                    booking=booking,
                    full_name='Priya Sharma',
                    age=29,
                    gender='F',
                    seat_number=f"B1-{11 + i}",
                    berth_preference='Middle'
                )

                if booking.payment_status == 'PAID':
                    Payment.objects.create(
                        booking=booking,
                        amount=booking.total_fare,
                        payment_method=random.choice(['UPI', 'CREDIT_CARD', 'NET_BANKING']),
                        transaction_reference=f"TXN-DEMO-{uuid.uuid4().hex[:8].upper()}",
                        payment_status='SUCCESS',
                        is_demo=True
                    )

            self.stdout.write(self.style.SUCCESS("Seeded sample historical bookings and payments for analytics."))

        # 5. Seed initial Demand Prediction records
        if DemandPredictionRecord.objects.count() == 0:
            DemandPredictionRecord.objects.create(
                train_number='12951',
                route='MMCT-NDLS',
                travel_class='3A',
                journey_date=today + timedelta(days=3),
                predicted_demand=88.5,
                demand_level='VERY_HIGH',
                model_version='v1.2-randomforest',
                is_synthetic=True
            )
            DemandPredictionRecord.objects.create(
                train_number='22436',
                route='NDLS-BSB',
                travel_class='CC',
                journey_date=today + timedelta(days=5),
                predicted_demand=79.0,
                demand_level='HIGH',
                model_version='v1.2-randomforest',
                is_synthetic=True
            )
            DemandPredictionRecord.objects.create(
                train_number='12004',
                route='NDLS-LKO',
                travel_class='CC',
                journey_date=today + timedelta(days=7),
                predicted_demand=62.4,
                demand_level='MODERATE',
                model_version='v1.2-randomforest',
                is_synthetic=True
            )

        self.stdout.write(self.style.SUCCESS("RailBook AI Database seeding completed successfully!"))
