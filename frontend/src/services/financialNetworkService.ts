import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  Node, Edge, Transaction, SimulationParams,
  SimulationResponse, APIError, AuthResponse
} from './types';

class FinancialNetworkService {
  private baseURL = '/api/';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshing: Promise<string> | null = null;

  constructor() {
    axios.defaults.baseURL = this.baseURL;
    
    // Load tokens from storage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    if (this.accessToken) {
      this.setAuthHeader(this.accessToken);
    }

    // Add request interceptor to handle token expiration
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is not 401 or request has already been retried, reject
        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          // Get new access token
          const newAccessToken = await this.refreshAccessToken();
          
          // Update the failed request with new token
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          
          // Retry the original request
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh fails, log out user
          this.logout();
          return Promise.reject(refreshError);
        }
      }
    );
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, return the existing promise
    if (this.refreshing) {
      return this.refreshing;
    }

    try {
      this.refreshing = this.doRefreshToken();
      const newToken = await this.refreshing;
      return newToken;
    } finally {
      this.refreshing = null;
    }
  }

  private async doRefreshToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<AuthResponse>('token/refresh/', {
        refresh: this.refreshToken
      });

      const newAccessToken = response.data.access;
      if (!newAccessToken) {
        throw new Error('No access token received');
      }

      this.accessToken = newAccessToken;
      localStorage.setItem('accessToken', newAccessToken);
      this.setAuthHeader(newAccessToken);

      return newAccessToken;
    } catch (error) {
      // If refresh fails, clear tokens
      this.logout();
      throw error;
    }
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
  async login(username: string, password: string): Promise<void> {
    const response = await axios.post<AuthResponse>('token/', { username, password })
      .catch(error => this.handleError(error as AxiosError));
      
    const { access, refresh } = response.data;
    
    if (!access || !refresh) {
      throw new Error('Invalid token response');
    }

    this.accessToken = access;
    this.refreshToken = refresh;
    
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    
    this.setAuthHeader(access);
  }

  async logout(): Promise<void> {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.accessToken = null;
    this.refreshToken = null;
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