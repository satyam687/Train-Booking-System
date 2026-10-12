from django.urls import path
from .views import (
    DemandPredictionView,
    TrainRecommendationsView,
    ModelInfoView,
    FareInsightsView,
)

urlpatterns = [
    path('demand-prediction/', DemandPredictionView.as_view(), name='ml-demand-prediction'),
    path('recommendations/', TrainRecommendationsView.as_view(), name='ml-recommendations'),
    path('model-info/', ModelInfoView.as_view(), name='ml-model-info'),
    path('fare-insights/', FareInsightsView.as_view(), name='ml-fare-insights'),
]
