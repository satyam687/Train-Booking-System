from django.urls import path
from .fare_views import FareQueryView, FareQuoteView

urlpatterns = [
    path('', FareQueryView.as_view(), name='fare-query'),
    path('quote/', FareQuoteView.as_view(), name='fare-quote'),
]
