from django.db import models
from django.contrib.auth.models import User

class Node(models.Model):
    NODE_TYPES = [
        ('INCOME', 'Income Source'),
        ('ACCOUNT', 'Account'),
        ('EXPENSE', 'Expense'),
    ]
    
    name = models.CharField(max_length=100)
    node_type = models.CharField(max_length=20, choices=NODE_TYPES)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.node_type})"

class Edge(models.Model):
    source = models.ForeignKey(Node, related_name='outgoing_edges', on_delete=models.CASCADE)
    target = models.ForeignKey(Node, related_name='incoming_edges', on_delete=models.CASCADE)
    weight = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.source.name} → {self.target.name}"

class Transaction(models.Model):
    edge = models.ForeignKey(Edge, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    scheduled_date = models.DateTimeField()
    is_recurring = models.BooleanField(default=False)
    recurrence_interval = models.DurationField(null=True, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.edge} - {self.amount}"