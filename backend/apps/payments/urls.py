from django.urls import path
from .views import DemoPaymentProcessView, PaymentDetailView

urlpatterns = [
    path('demo/', DemoPaymentProcessView.as_view(), name='payment-demo'),
    path('<str:reference>/', PaymentDetailView.as_view(), name='payment-detail'),
]
