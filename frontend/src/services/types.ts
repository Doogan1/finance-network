export interface Node {
  id?: number;
  name: string;
  node_type: 'account' | 'expense' | 'income' | 'investment';
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface Edge {
  id?: number;
  source: number;
  target: number;
  weight: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id?: number;
  edge: number;
  amount: number;
  scheduled_date: string;
  is_recurring: boolean;
  recurrence_interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at?: string;
  updated_at?: string;
}

export interface SimulationParams {
  start_date: string;
  end_date: string;
  include_metrics?: boolean;
}

export interface NetworkMetrics {
  total_inflow: number;
  total_outflow: number;
  net_worth: number;
  risk_score: number;
}

export interface SimulationResponse {
  simulation_results: Transaction[];
  network_metrics: NetworkMetrics;
}

export interface APIError {
  message: string;
  status: number;
  details?: any;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
}