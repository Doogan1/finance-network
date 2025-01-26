from rest_framework import serializers
from .models import Node, Edge, Transaction

class NodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Node
        fields = ['id', 'name', 'node_type', 'balance', 'created_at', 'updated_at']
        read_only_fields = ['owner']

class EdgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Edge
        fields = ['id', 'source', 'target', 'weight', 'created_at', 'updated_at']
        read_only_fields = ['owner']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'edge', 'amount', 'scheduled_date', 'is_recurring', 
                 'recurrence_interval', 'created_at', 'updated_at']
        read_only_fields = ['owner']