// Network types (Hub-and-Spoke VPN)
export interface Network {
  id: string;
  name: string;
  cidr: string;
  server_public_key?: string;  // Hub's public key
  server_endpoint?: string;    // Hub's endpoint (IP:Port)
  listen_port?: number;        // UDP Port
  interface_name?: string;     // WireGuard Interface (wg0, etc)
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


// System Info types
export interface SystemInfo {
  cpu_cores: number;
  cpu_model?: string;
  load_1m?: string;
  load_5m?: string;
  load_15m?: string;
  memory_total: number;
  memory_free: number;
  memory_available: number;
  memory_used: number;
  memory_buffers?: number;
  memory_cached?: number;
  disk_total: number;
  disk_used: number;
  disk_free: number;
  uptime_seconds: number;
  hostname: string;
}

// Fail2Ban types
export interface Fail2BanJail {
  name: string;
  banned_count?: number;
  total_banned?: number;
  banned_ips?: string[];
  failed_count?: number;
  total_failed?: number;
}

export interface Fail2BanStatus {
  installed: boolean;
  running: boolean;
  jails: Fail2BanJail[];
}

export interface Fail2BanLogEntry {
  raw: string;
  timestamp?: string;
  action?: 'ban' | 'unban' | 'found';
}

export interface Fail2BanLogs {
  logs: Fail2BanLogEntry[];
  count: number;
  error?: string;
}

// Stats Overview types
export interface NetworkStats {
  id: string;
  name: string;
  cidr: string;
  interface: string;
  total_nodes: number;
  online_nodes: number;
  offline_nodes: number;
  pending_nodes: number;
  expired_nodes: number;
  transfer_rx: number;
  transfer_tx: number;
}

export interface StatsOverview {
  total_networks: number;
  total_nodes: number;
  online_nodes: number;
  offline_nodes: number;
  pending_nodes: number;
  expired_nodes: number;
  total_rx: number;
  total_tx: number;
  networks: NetworkStats[];
}
