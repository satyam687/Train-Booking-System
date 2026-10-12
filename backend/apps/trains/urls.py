from django.urls import path
from .views import (
    TrainListView,
    TrainDetailView,
    TrainSearchListView,
    TrainLiveStatusView,
    SeatAvailabilityView,
)

urlpatterns = [
    path('', TrainListView.as_view(), name='train-list'),
    path('search/', TrainSearchListView.as_view(), name='train-search'),
    path('availability/', SeatAvailabilityView.as_view(), name='train-availability'),
    path('<str:id>/', TrainDetailView.as_view(), name='train-detail'),
    path('<str:id>/status/', TrainLiveStatusView.as_view(), name='train-status'),
]
