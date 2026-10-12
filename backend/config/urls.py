from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Core REST APIs
    path('api/auth/', include('apps.accounts.urls')),
    path('api/stations/', include('apps.stations.urls')),
    path('api/trains/', include('apps.trains.urls')),
    path('api/fares/', include('apps.trains.fare_urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/ml/', include('apps.machine_learning.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),

    # API Documentation via drf-spectacular OpenAPI 3.0
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
