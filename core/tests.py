from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from core.models import Node, Edge, Transaction
from simulation.engine import NetworkSimulator
from decimal import Decimal
from datetime import timedelta

class NodeModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'testpass')
        
    def test_node_creation(self):
        node = Node.objects.create(
            name='Salary',
            node_type='INCOME',
            balance=Decimal('5000.00'),
            owner=self.user
        )
        self.assertEqual(node.name, 'Salary')
        self.assertEqual(node.balance, Decimal('5000.00'))

class EdgeModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'testpass')
        self.source = Node.objects.create(
            name='Checking',
            node_type='ACCOUNT',
            owner=self.user
        )
        self.target = Node.objects.create(
            name='Rent',
            node_type='EXPENSE',
            owner=self.user
        )
    
    def test_edge_creation(self):
        edge = Edge.objects.create(
            source=self.source,
            target=self.target,
            weight=Decimal('1000.00'),
            owner=self.user
        )
        self.assertEqual(edge.weight, Decimal('1000.00'))
        self.assertEqual(str(edge), 'Checking → Rent')

class NodeAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'testpass')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('node-list')
    
    def test_create_node(self):
        data = {
            'name': 'Savings',
            'node_type': 'ACCOUNT',
            'balance': '1000.00'
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Node.objects.count(), 1)

class SimulationTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('testuser', 'test@test.com', 'testpass')
        self.income = Node.objects.create(
            name='Salary',
            node_type='INCOME',
            balance=Decimal('5000.00'),
            owner=self.user
        )
        self.account = Node.objects.create(
            name='Checking',
            node_type='ACCOUNT',
            balance=Decimal('1000.00'),
            owner=self.user
        )
        self.edge = Edge.objects.create(
            source=self.income,
            target=self.account,
            weight=Decimal('5000.00'),
            owner=self.user
        )
    
    def test_simulation(self):
        now = timezone.now()
        Transaction.objects.create(
            edge=self.edge,
            amount=Decimal('5000.00'),
            scheduled_date=now,
            is_recurring=True,
            recurrence_interval=timedelta(days=30),
            owner=self.user
        )
        
        simulator = NetworkSimulator(self.user.id)
        results = simulator.simulate_transactions(
            now,
            now + timedelta(days=60)
        )
        
        expected_balance = float(self.account.balance) + (5000.00 * 2)
        self.assertEqual(
            results[self.account.id]['balance'],
            expected_balance
        )