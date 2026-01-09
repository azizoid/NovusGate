package models

import (
	"net"
	"time"
)

// NodeStatus represents the current status of a node
type NodeStatus string

const (
	NodeStatusPending NodeStatus = "pending"
	NodeStatusOnline  NodeStatus = "online"
	NodeStatusOffline NodeStatus = "offline"
	NodeStatusExpired NodeStatus = "expired"
)

// Network represents a VPN network (Hub configuration)
type Network struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	CIDR             string    `json:"cidr"`
	ServerPrivateKey string    `json:"-"`                           // Hub's private key (never sent to client)
	ServerPublicKey  string    `json:"server_public_key,omitempty"` // Hub's public key (sent to peers)
	ServerEndpoint   string    `json:"server_endpoint,omitempty"`   // Hub's endpoint (IP:Port)
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// Node represents a peer (spoke) in the VPN network
type Node struct {
	ID        string            `json:"id"`
	NetworkID string            `json:"network_id"`
	Name      string            `json:"name"`
	VirtualIP net.IP            `json:"virtual_ip"`
	PublicKey string            `json:"public_key"`
	Labels    map[string]string `json:"labels"`
	Status    NodeStatus        `json:"status"`
	LastSeen  time.Time         `json:"last_seen"`
	PublicIP  string            `json:"public_ip,omitempty"`
	TransferRx int64            `json:"transfer_rx,omitempty"`
	TransferTx int64            `json:"transfer_tx,omitempty"`
	ExpiresAt *time.Time        `json:"expires_at,omitempty"`
	NodeInfo  *NodeInfo         `json:"node_info,omitempty"`
	Endpoints []string          `json:"endpoints"`
	CreatedAt time.Time         `json:"created_at"`
}

// NodeInfo contains metadata about the node's system
type NodeInfo struct {
	OS           string `json:"os"`
	Architecture string `json:"arch"`
	Hostname     string `json:"hostname"`
}

// User represents a system user (admin)
type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

// NetworkEvent represents a real-time network event
type NetworkEvent struct {
	Type      EventType `json:"type"`
	Payload   any       `json:"payload"`
	Timestamp time.Time `json:"timestamp"`
}

// EventType represents the type of network event
type EventType string

const (
	EventTypePeerAdded   EventType = "peer_added"
	EventTypePeerRemoved EventType = "peer_removed"
	EventTypePeerUpdated EventType = "peer_updated"
)
