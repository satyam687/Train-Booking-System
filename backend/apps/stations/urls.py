from django.urls import path
from .views import StationListView, StationDetailView

urlpatterns = [
    path('', StationListView.as_view(), name='station-list'),
    path('<str:code>/', StationDetailView.as_view(), name='station-detail'),
]
