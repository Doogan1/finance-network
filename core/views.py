from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from .models import Node, Edge, Transaction
from .serializers import NodeSerializer, EdgeSerializer, TransactionSerializer
from simulation.engine import NetworkSimulator

class NodeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NodeSerializer

    def get_queryset(self):
        return Node.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class EdgeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EdgeSerializer

    def get_queryset(self):
        return Edge.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['post'])
    def simulate(self, request):
        start_date = datetime.fromisoformat(request.data.get('start_date'))
        end_date = datetime.fromisoformat(request.data.get('end_date'))
        
        simulator = NetworkSimulator(request.user.id)
        results = simulator.simulate_transactions(start_date, end_date)
        metrics = simulator.get_network_metrics()
        
        return Response({
            'simulation_results': results,
            'network_metrics': metrics
        })