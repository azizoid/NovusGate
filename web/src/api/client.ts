import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Network,
  Node,
  CreateNetworkForm,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_KEY = import.meta.env.VITE_API_KEY || '';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api/v1`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add error interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Networks
  async getNetworks(): Promise<Network[]> {
    const { data } = await this.client.get<Network[]>('/networks');
    return data;
  }

  async getNetwork(id: string): Promise<Network> {
    const { data } = await this.client.get<Network>(`/networks/${id}`);
    return data;
  }

  async createNetwork(network: CreateNetworkForm): Promise<Network> {
    const { data } = await this.client.post<Network>('/networks', network);
    return data;
  }

  async deleteNetwork(id: string): Promise<void> {
    await this.client.delete(`/networks/${id}`);
  }

  // Nodes
  async getNodes(networkId: string): Promise<Node[]> {
    const { data } = await this.client.get<Node[]>(`/networks/${networkId}/nodes`);
    return data;
  }

  async getNode(id: string): Promise<Node> {
    const { data } = await this.client.get<Node>(`/nodes/${id}`);
    return data;
  }

  async deleteNode(id: string): Promise<void> {
    await this.client.delete(`/nodes/${id}`);
  }

  async updateNode(id: string, data: { name?: string; expires_at?: string | null; status?: string; node_info?: { os: string; arch: string; hostname: string } }): Promise<Node> {
    const { data: res } = await this.client.put<Node>(`/nodes/${id}`, data);
    return res;
  }

  async createServerWithConfig(networkId: string, data: any): Promise<any> {
    const { data: res } = await this.client.post(`/networks/${networkId}/servers`, data);
    return res;
  }

  async getNodeConfig(nodeId: string): Promise<string> {
    const { data } = await this.client.get(`/nodes/${nodeId}/config`, {
      responseType: 'text',
    });
    return data;
  }

  async getNodeQrCode(nodeId: string): Promise<Blob> {
    const { data } = await this.client.get(`/nodes/${nodeId}/qrcode`, {
      responseType: 'blob',
    });
    return data;
  }
  // User Management
  async updatePassword(username: string, oldPass: string, newPass: string): Promise<void> {
    await this.client.put('/auth/password', { username, oldPassword: oldPass, newPassword: newPass });
  }

  async getUsers(): Promise<any[]> {
    const { data } = await this.client.get('/users');
    return data;
  }

  async createUser(username: string, password: string): Promise<any> {
    const { data } = await this.client.post('/users', { username, password });
    return data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; version: string }> {
    const { data } = await this.client.get('/health');
    return data;
  }
}

export const api = new ApiClient();

export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'X-API-Key': import.meta.env.VITE_API_KEY || '',
  };
};

// React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Export hooks


// Network hooks
export function useNetworks() {
  return useQuery({
    queryKey: ['networks'],
    queryFn: () => api.getNetworks(),
  });
}

export function useNetwork(id: string) {
  return useQuery({
    queryKey: ['networks', id],
    queryFn: () => api.getNetwork(id),
    enabled: !!id,
  });
}

export function useCreateNetwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNetworkForm) => api.createNetwork(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networks'] });
    },
  });
}

export function useDeleteNetwork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNetwork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networks'] });
    },
  });
}

// Node hooks
export function useNodes(networkId: string) {
  return useQuery({
    queryKey: ['nodes', networkId],
    queryFn: () => api.getNodes(networkId),
    enabled: !!networkId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useNode(id: string) {
  return useQuery({
    queryKey: ['nodes', 'detail', id],
    queryFn: () => api.getNode(id),
    enabled: !!id,
  });
}

export function useDeleteNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

export function useCreateServerWithConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { networkId: string; data: any }) => 
      api.createServerWithConfig(vars.networkId, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

export function useUpdateNode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: { name?: string; expires_at?: string | null; status?: string; node_info?: { os: string; arch: string; hostname: string } } }) =>
      api.updateNode(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
  });
}

// User Management hooks
export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: { username: string; oldPass: string; newPass: string }) =>
      api.updatePassword(data.username, data.oldPass, data.newPass),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { username: string; password: string }) =>
      api.createUser(data.username, data.password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
