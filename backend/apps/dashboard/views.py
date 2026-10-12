from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta, date
from apps.accounts.permissions import IsAdminUserRole
from apps.bookings.models import Booking
from apps.bookings.serializers import BookingSerializer
from apps.trains.models import Train, TrainSchedule
from apps.stations.models import Station
from apps.payments.models import Payment
from apps.machine_learning.models import DemandPredictionRecord

class DashboardSummaryView(views.APIView):
    """
    Summary metrics for Admin and Operational Dashboards.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        total_bookings = Booking.objects.count()
        confirmed_bookings = Booking.objects.filter(booking_status='CONFIRMED').count()
        total_revenue = Booking.objects.filter(booking_status='CONFIRMED').aggregate(Sum('total_fare'))['total_fare__sum'] or 0.00
        active_trains = Train.objects.filter(is_active=True).count()
        total_stations = Station.objects.count()

        # Recent 5 bookings
        recent_bookings = Booking.objects.select_related('user', 'train_schedule__train', 'train_class').order_by('-created_at')[:5]

        return Response({
            'total_bookings': total_bookings,
            'confirmed_bookings': confirmed_bookings,
            'total_revenue': float(total_revenue),
            'active_trains': active_trains,
            'total_stations': total_stations,
            'recent_bookings': BookingSerializer(recent_bookings, many=True).data
        })


class BookingAnalyticsView(views.APIView):
    """
    Time-series and distribution metrics for Recharts visualizations.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        today = date.today()
        daily_trends = []

        # Last 7 days booking trend
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_bookings = Booking.objects.filter(created_at__date=day)
            count = day_bookings.count()
            rev = day_bookings.filter(booking_status='CONFIRMED').aggregate(Sum('total_fare'))['total_fare__sum'] or 0.00
            daily_trends.append({
                'date': day.strftime('%d %b'),
                'bookings': count,
                'revenue': float(rev)
            })

        # Class breakdown
        class_distribution = list(
            Booking.objects.values('train_class__class_code')
            .annotate(count=Count('id'), revenue=Sum('total_fare'))
            .order_by('-count')
        )

        formatted_class_dist = [
            {
                'class_code': item['train_class__class_code'] or 'Unknown',
                'count': item['count'],
                'revenue': float(item['revenue'] or 0.0)
            }
            for item in class_distribution
        ]

        # Payment methods breakdown
        payment_distribution = list(
            Payment.objects.values('payment_method')
            .annotate(count=Count('id'), total_amount=Sum('amount'))
            .order_by('-count')
        )

        return Response({
            'daily_trends': daily_trends,
            'class_distribution': formatted_class_dist,
            'payment_distribution': payment_distribution
        })


class DemandAnalyticsView(views.APIView):
    """
    ML demand prediction insights and route density analytics.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        predictions = DemandPredictionRecord.objects.order_by('-created_at')[:20]

        # Popular routes avg predicted demand
        route_stats = list(
            DemandPredictionRecord.objects.values('route')
            .annotate(avg_demand=Avg('predicted_demand'), count=Count('id'))
            .order_by('-avg_demand')[:6]
        )

        # High demand trains
        high_demand_trains = list(
            DemandPredictionRecord.objects.filter(predicted_demand__gte=75.0)
            .values('train_number', 'route', 'predicted_demand', 'journey_date')
            .order_by('-predicted_demand')[:5]
        )

        return Response({
            'recent_predictions_count': predictions.count(),
            'route_demand_averages': [
                {'route': r['route'], 'avg_demand': round(r['avg_demand'], 1), 'queries': r['count']}
                for r in route_stats
            ],
            'high_demand_trains': high_demand_trains
        })
