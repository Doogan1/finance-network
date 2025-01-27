import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import financialNetworkService from '../financialNetworkService';
import { Node, Edge, Transaction, SimulationParams } from '../types';

jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Helper function to create mock responses
const createMockResponse = <T>(data: T): Promise<AxiosResponse<T>> => {
  return Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: {}
    } as InternalAxiosRequestConfig
  } as AxiosResponse<T>);
};

describe('FinancialNetworkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    const mockToken = 'test-token';
    const mockCredentials = {
      username: 'testuser',
      password: 'testpass'
    };

    it('should successfully login and store token', async () => {
      mockAxios.post.mockResolvedValueOnce(createMockResponse({ access: mockToken }));

      const token = await financialNetworkService.login(
        mockCredentials.username,
        mockCredentials.password
      );

      expect(token).toBe(mockToken);
      expect(localStorage.getItem('authToken')).toBe(mockToken);
      expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('should handle login failure', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { detail: 'Invalid credentials' }
        }
      };
      mockAxios.post.mockRejectedValueOnce(mockError);

      await expect(
        financialNetworkService.login(mockCredentials.username, mockCredentials.password)
      ).rejects.toBeDefined();
    });

    it('should clear token on logout', async () => {
      localStorage.setItem('authToken', mockToken);
      await financialNetworkService.logout();

      expect(localStorage.getItem('authToken')).toBe(null);
      expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('Node Operations', () => {
    const mockNode: Node = {
      id: 1,
      name: 'Test Node',
      node_type: 'account',
      balance: 1000
    };

    it('should create a node', async () => {
      mockAxios.post.mockResolvedValueOnce(createMockResponse(mockNode));

      const result = await financialNetworkService.createNode(mockNode);
      expect(result).toEqual(mockNode);
    });

    it('should get all nodes', async () => {
      const mockNodes = [mockNode];
      mockAxios.get.mockResolvedValueOnce(createMockResponse(mockNodes));

      const result = await financialNetworkService.getNodes();
      expect(result).toEqual(mockNodes);
    });

    it('should get a single node', async () => {
      mockAxios.get.mockResolvedValueOnce(createMockResponse(mockNode));

      const result = await financialNetworkService.getNode(1);
      expect(result).toEqual(mockNode);
    });

    it('should update a node', async () => {
      const updatedNode: Node = { ...mockNode, balance: 2000 };
      mockAxios.put.mockResolvedValueOnce(createMockResponse(updatedNode));

      const result = await financialNetworkService.updateNode(updatedNode);
      expect(result).toEqual(updatedNode);
    });

    it('should delete a node', async () => {
      mockAxios.delete.mockResolvedValueOnce(createMockResponse(undefined));

      await expect(financialNetworkService.deleteNode(1)).resolves.not.toThrow();
    });

    it('should handle node operation errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { detail: 'Node not found' }
        }
      };
      mockAxios.get.mockRejectedValueOnce(mockError);

      await expect(financialNetworkService.getNode(999)).rejects.toBeDefined();
    });
  });

  describe('Edge Operations', () => {
    const mockEdge: Edge = {
      id: 1,
      source: 1,
      target: 2,
      weight: 1
    };

    it('should create an edge', async () => {
      mockAxios.post.mockResolvedValueOnce(createMockResponse(mockEdge));

      const result = await financialNetworkService.createEdge(mockEdge);
      expect(result).toEqual(mockEdge);
    });

    it('should get all edges', async () => {
      const mockEdges = [mockEdge];
      mockAxios.get.mockResolvedValueOnce(createMockResponse(mockEdges));

      const result = await financialNetworkService.getEdges();
      expect(result).toEqual(mockEdges);
    });

    it('should get a single edge', async () => {
      mockAxios.get.mockResolvedValueOnce(createMockResponse(mockEdge));

      const result = await financialNetworkService.getEdge(1);
      expect(result).toEqual(mockEdge);
    });

    it('should update an edge', async () => {
      const updatedEdge: Edge = { ...mockEdge, weight: 2 };
      mockAxios.put.mockResolvedValueOnce(createMockResponse(updatedEdge));

      const result = await financialNetworkService.updateEdge(updatedEdge);
      expect(result).toEqual(updatedEdge);
    });

    it('should delete an edge', async () => {
      mockAxios.delete.mockResolvedValueOnce(createMockResponse(undefined));

      await expect(financialNetworkService.deleteEdge(1)).resolves.not.toThrow();
    });
  });

  describe('Transaction Operations', () => {
    const mockTransaction: Transaction = {
      id: 1,
      edge: 1,
      amount: 100,
      scheduled_date: new Date().toISOString(),
      is_recurring: false
    };

    it('should create a transaction', async () => {
      mockAxios.post.mockResolvedValueOnce(createMockResponse(mockTransaction));

      const result = await financialNetworkService.createTransaction(mockTransaction);
      expect(result).toEqual(mockTransaction);
    });

    it('should get all transactions', async () => {
      const mockTransactions = [mockTransaction];
      mockAxios.get.mockResolvedValueOnce(createMockResponse(mockTransactions));

      const result = await financialNetworkService.getTransactions();
      expect(result).toEqual(mockTransactions);
    });

    it('should get a single transaction', async () => {
      mockAxios.get.mockResolvedValueOnce(createMockResponse(mockTransaction));

      const result = await financialNetworkService.getTransaction(1);
      expect(result).toEqual(mockTransaction);
    });

    it('should update a transaction', async () => {
      const updatedTransaction: Transaction = { ...mockTransaction, amount: 200 };
      mockAxios.put.mockResolvedValueOnce(createMockResponse(updatedTransaction));

      const result = await financialNetworkService.updateTransaction(updatedTransaction);
      expect(result).toEqual(updatedTransaction);
    });

    it('should delete a transaction', async () => {
      mockAxios.delete.mockResolvedValueOnce(createMockResponse(undefined));

      await expect(financialNetworkService.deleteTransaction(1)).resolves.not.toThrow();
    });
  });

  describe('Simulation', () => {
    const mockSimulationParams: SimulationParams = {
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      include_metrics: true
    };

    const mockSimulationResponse = {
      simulation_results: [
        { 
          edge: 1,
          amount: 100,
          scheduled_date: '2024-01-15T00:00:00Z',
          is_recurring: false
        }
      ],
      network_metrics: {
        total_inflow: 1000,
        total_outflow: 200,
        net_worth: 800,
        risk_score: 0.2
      }
    };

    it('should simulate transactions', async () => {
      mockAxios.post.mockResolvedValueOnce(createMockResponse(mockSimulationResponse));

      const result = await financialNetworkService.simulateTransactions(mockSimulationParams);
      expect(result).toEqual(mockSimulationResponse);
    });

    it('should handle simulation errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'Invalid simulation parameters' }
        }
      };
      mockAxios.post.mockRejectedValueOnce(mockError);

      await expect(financialNetworkService.simulateTransactions(mockSimulationParams)).rejects.toBeDefined();
    });
  });
});
