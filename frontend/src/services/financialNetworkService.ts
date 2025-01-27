import axios, { AxiosError } from 'axios';
import {
  Node, Edge, Transaction, SimulationParams,
  SimulationResponse, APIError, AuthResponse
} from './types';

class FinancialNetworkService {
  private baseURL = '/api/';
  private token: string | null = null;

  constructor() {
    axios.defaults.baseURL = this.baseURL;
    this.token = localStorage.getItem('authToken');
    if (this.token) {
      this.setAuthHeader(this.token);
    }
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private handleError(error: AxiosError): never {
    const apiError: APIError = {
      message: error.message,
      status: error.response?.status || 500,
      details: error.response?.data
    };
    throw apiError;
  }

  // Authentication
  async login(username: string, password: string): Promise<string> {
    const response = await axios.post<AuthResponse>('token/', { username, password })
      .catch(error => this.handleError(error as AxiosError));
      
    const token = response.data.access;
    if (!token) {
      throw new Error('No access token received');
    }
    this.token = token;
    localStorage.setItem('authToken', token);
    this.setAuthHeader(token);
    return token;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
    this.token = null;
    delete axios.defaults.headers.common['Authorization'];
  }

  // Node Operations
  async createNode(node: Node): Promise<Node> {
    const response = await axios.post('nodes/', node)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async getNodes(): Promise<Node[]> {
    const response = await axios.get('nodes/')
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async getNode(nodeId: number): Promise<Node> {
    const response = await axios.get(`nodes/${nodeId}/`)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async updateNode(node: Node): Promise<Node> {
    const response = await axios.put(`nodes/${node.id}/`, node)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async deleteNode(nodeId: number): Promise<void> {
    await axios.delete(`nodes/${nodeId}/`)
      .catch(error => this.handleError(error as AxiosError));
  }

  // Edge Operations
  async createEdge(edge: Edge): Promise<Edge> {
    const response = await axios.post('edges/', edge)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async getEdges(): Promise<Edge[]> {
    const response = await axios.get('edges/')
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async getEdge(edgeId: number): Promise<Edge> {
    const response = await axios.get(`edges/${edgeId}/`)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async updateEdge(edge: Edge): Promise<Edge> {
    const response = await axios.put(`edges/${edge.id}/`, edge)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async deleteEdge(edgeId: number): Promise<void> {
    await axios.delete(`edges/${edgeId}/`)
      .catch(error => this.handleError(error as AxiosError));
  }

  // Transaction Operations
  async createTransaction(transaction: Transaction): Promise<Transaction> {
    const response = await axios.post('transactions/', transaction)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async getTransactions(): Promise<Transaction[]> {
    const response = await axios.get('transactions/')
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async getTransaction(transactionId: number): Promise<Transaction> {
    const response = await axios.get(`transactions/${transactionId}/`)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    const response = await axios.put(`transactions/${transaction.id}/`, transaction)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }

  async deleteTransaction(transactionId: number): Promise<void> {
    await axios.delete(`transactions/${transactionId}/`)
      .catch(error => this.handleError(error as AxiosError));
  }

  // Simulation
  async simulateTransactions(params: SimulationParams): Promise<SimulationResponse> {
    const response = await axios.post('transactions/simulate/', params)
      .catch(error => this.handleError(error as AxiosError));
    return response.data;
  }
}

export default new FinancialNetworkService();