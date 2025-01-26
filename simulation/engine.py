import networkx as nx
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List
from core.models import Node, Edge, Transaction

class NetworkSimulator:
    def __init__(self, user_id: int):
        self.user_id = user_id
        self.graph = nx.DiGraph()
        self._load_network()

    def _load_network(self):
        nodes = Node.objects.filter(owner_id=self.user_id)
        edges = Edge.objects.filter(owner_id=self.user_id)
        
        for node in nodes:
            self.graph.add_node(node.id, 
                              balance=float(node.balance),
                              type=node.node_type)
        
        for edge in edges:
            self.graph.add_edge(edge.source.id, 
                              edge.target.id,
                              weight=float(edge.weight))

    def simulate_transactions(self, start_date: datetime, end_date: datetime) -> Dict:
        transactions = Transaction.objects.filter(
            owner_id=self.user_id,
            scheduled_date__range=(start_date, end_date)
        )
        
        simulation_results = {
            node_id: {'balance': self.graph.nodes[node_id]['balance']}
            for node_id in self.graph.nodes
        }

        for transaction in transactions:
            source_id = transaction.edge.source.id
            target_id = transaction.edge.target.id
            amount = float(transaction.amount)

            # Process initial transaction
            if start_date <= transaction.scheduled_date < end_date:
                simulation_results[source_id]['balance'] -= amount
                simulation_results[target_id]['balance'] += amount

            # Process recurring transactions
            if transaction.is_recurring and transaction.recurrence_interval:
                next_date = transaction.scheduled_date + transaction.recurrence_interval
                while next_date < end_date:  # Changed <= to <
                    simulation_results[source_id]['balance'] -= amount
                    simulation_results[target_id]['balance'] += amount
                    next_date += transaction.recurrence_interval

        return simulation_results

    def get_network_metrics(self) -> Dict:
        return {
            'total_nodes': self.graph.number_of_nodes(),
            'total_edges': self.graph.number_of_edges(),
            'income_nodes': len([n for n in self.graph.nodes 
                               if self.graph.nodes[n]['type'] == 'INCOME']),
            'expense_nodes': len([n for n in self.graph.nodes 
                                if self.graph.nodes[n]['type'] == 'EXPENSE']),
            'net_flow': sum(self.graph.nodes[n]['balance'] for n in self.graph.nodes)
        }