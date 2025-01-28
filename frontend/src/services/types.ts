export interface Node {
  id: number;
  name: string;
  node_type: string;
  balance: number;
  owner?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Edge {
  id: number;
  source: number;
  target: number;
  weight: number;
  owner?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: number;
  edge: number;
  amount: number;
  scheduled_date: string;
  is_recurring: boolean;
  recurrence_interval?: string;
  owner?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SimulationParams {
  start_date: string;
  end_date: string;
  nodes?: number[];
}

export interface SimulationResponse {
  nodes: Node[];
  transactions: Transaction[];
}

export interface APIError {
  message: string;
  status: number;
  details?: any;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}