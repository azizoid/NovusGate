// Network types (Hub-and-Spoke VPN)
export interface Network {
  id: string;
  name: string;
  cidr: string;
  server_public_key?: string;  // Hub's public key
  server_endpoint?: string;    // Hub's endpoint (IP:Port)
  created_at: string;
  updated_at: string;
  node_count?: number;
  online_nodes?: number;
}

// Node types (Peers/Spokes)
export type NodeStatus = 'pending' | 'online' | 'offline' | 'expired';

export interface NodeInfo {
  os: string;
  arch: string;
  hostname: string;
}

export interface Node {
  id: string;
  network_id: string;
  name: string;
  virtual_ip: string;
  public_key: string;
  labels: Record<string, string>;
  status: NodeStatus;
  last_seen: string;
  public_ip?: string;
  transfer_rx?: number;
  transfer_tx?: number;
  expires_at?: string;
  node_info?: NodeInfo;
  endpoints?: string[];
  created_at: string;
}

// API response types
export interface ApiError {
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

// Dashboard specific types
export interface NetworkStats {
  total_nodes: number;
  online_nodes: number;
}

export interface NetworkTopology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface TopologyNode {
  id: string;
  type: 'node';
  position: { x: number; y: number };
  data: {
    label: string;
    status: NodeStatus;
    ip: string;
  };
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  data?: {
    latency?: number;
    connected: boolean;
  };
}

// WebSocket event types
export type EventType = 
  | 'node_status'
  | 'peer_added'
  | 'peer_removed';

export interface WebSocketEvent {
  type: EventType;
  payload: any;
  timestamp: string;
}

export interface NodeStatusEvent {
  type: 'node_status';
  node_id: string;
  status: NodeStatus;
  timestamp: string;
}

// Form types
export interface CreateNetworkForm {
  name: string;
  cidr: string;
}

export interface CreateNodeForm {
  name: string;
  labels?: Record<string, string>;
}
