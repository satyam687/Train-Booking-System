from django.urls import path
from .views import DashboardSummaryView, BookingAnalyticsView, DemandAnalyticsView

urlpatterns = [
    path('summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('booking-analytics/', BookingAnalyticsView.as_view(), name='dashboard-booking-analytics'),
    path('demand-analytics/', DemandAnalyticsView.as_view(), name='dashboard-demand-analytics'),
]
