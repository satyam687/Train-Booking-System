from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Station
from .serializers import StationSerializer

class StationListView(generics.ListCreateAPIView):
    queryset = Station.objects.all()
    serializer_class = StationSerializer
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    search_fields = ('code', 'name', 'city', 'state')
    ordering_fields = ('code', 'name', 'city')
    ordering = ('name',)

class StationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Station.objects.all()
    serializer_class = StationSerializer
    lookup_field = 'code'
