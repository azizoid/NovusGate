package rest

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/novusmesh/novusmesh/internal/controlplane/store"
	"github.com/novusmesh/novusmesh/internal/shared/models"
	"github.com/novusmesh/novusmesh/internal/wireguard"
	"golang.org/x/crypto/bcrypt"
)

// Admin credentials from env or defaults
var (
	adminUsername = getEnvOrDefault("ADMIN_USERNAME", "admin")
	adminPassword = getEnvOrDefault("ADMIN_PASSWORD", "") // REQUIRED - set via environment
	adminToken    = ""
	apiKey        = getEnvOrDefault("novusmesh_API_KEY", "") // Request-level security key
)

func getEnvOrDefault(key, defaultValue string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultValue
}

func init() {
	// Generate a random admin token on startup
	b := make([]byte, 32)
	rand.Read(b)
	adminToken = hex.EncodeToString(b)
}

// PeerActivity tracks the last known activity of a peer
type PeerActivity struct {
	LastRxBytes int64
	LastSeen    time.Time
}

// Server is the REST API server
type Server struct {
	store        *store.Store
	router       *mux.Router
	managers   map[string]*wireguard.Manager
	managersMu sync.RWMutex
	peerActivity map[string]*PeerActivity
	activityMu   sync.RWMutex
}

// NewServer creates a new REST API server
func NewServer(store *store.Store) *Server {
	s := &Server{
		store:        store,
		router:       mux.NewRouter(),
		managers:     make(map[string]*wireguard.Manager),
		peerActivity: make(map[string]*PeerActivity),
	}
	s.setupRoutes()
	// Initialize existing networks from DB
	go s.loadNetworks()
	return s
}

// loadNetworks initializes managers for existing networks and imports/syncs peers
func (s *Server) loadNetworks() {
	// Give DB a moment to come up
	time.Sleep(2 * time.Second)
	
	ctx := context.Background()
	networks, err := s.store.ListNetworks(ctx)
	if err != nil {
		fmt.Printf("Error loading networks: %v\n", err)
		return
	}
	
	for _, network := range networks {
		if network.InterfaceName == "" {
			continue
		}
		// Initialize manager
		mgr := wireguard.NewManager(network.InterfaceName)
		if err := mgr.Init(); err != nil {
			fmt.Printf("Warning: WireGuard tools missing for %s\n", network.Name)
			continue
		}
		
		// If port is 0 (legacy), default to 51820
		port := network.ListenPort
		if port == 0 {
			port = 51820
		}
		
		// Ensure config exists/is valid (idempotent)
		s.managersMu.Lock()
		s.managers[network.ID] = mgr
		s.managersMu.Unlock()
		
		// Ensure interface is UP
		if err := mgr.Up(); err != nil {
			fmt.Printf("Note: Interface %s might already be up: %v\n", network.InterfaceName, err)
		} else {
			fmt.Printf("Network %s (%s) is UP on port %d\n", network.Name, network.InterfaceName, port)
		}

		// SYNC: Import existing peers from WireGuard into DB
		peers, err := mgr.GetPeers()
		if err == nil && len(peers) > 0 {
			fmt.Printf("Syncing %d peers from %s to database...\n", len(peers), network.InterfaceName)
			
			// Get existing DB nodes to avoid duplicates
			dbNodes, err := s.store.ListNodes(ctx, network.ID)
			if err != nil {
				fmt.Printf("Failed to list DB nodes: %v\n", err)
				continue
			}
			
			existingKeys := make(map[string]bool)
			for _, n := range dbNodes {
				existingKeys[n.PublicKey] = true
			}
			
			for pubKey, peer := range peers {
				if !existingKeys[pubKey] {
					// Import this peer
					fmt.Printf("Importing peer %s...\n", pubKey)
					
					// Parse IP from AllowedIPs (first one if comma separated)
					ips := strings.Split(peer.AllowedIPs, ",")
					if len(ips) == 0 {
						fmt.Printf("Warning: No AllowedIPs for peer %s, skipping import\n", pubKey)
						continue
					}
					
					// Take first IP and remove CIDR suffix if present
					ipStr := strings.TrimSpace(ips[0])
					if idx := strings.Index(ipStr, "/"); idx != -1 {
						ipStr = ipStr[:idx]
					}
					
					virtualIP := net.ParseIP(ipStr)
					if virtualIP == nil {
						fmt.Printf("Warning: Invalid IP %s for peer %s, skipping import\n", ipStr, pubKey)
						continue
					}

					// Create Node
					hostname := "imported-client"
					// Try to give a better name for admin network
					if network.InterfaceName == "wg1" {
						hostname = "Admin Client"
					} else {
						hostname = fmt.Sprintf("Imported Node (%s)", ipStr)
					}

					node := &models.Node{
						NetworkID: network.ID,
						Name:      hostname,
						PublicKey: pubKey,
						VirtualIP: virtualIP,
						Status:    models.NodeStatusOnline, // Assume online if present in WG
						NodeInfo: &models.NodeInfo{
							Hostname:     hostname,
							OS:           "unknown",
							Architecture: "unknown",
						},
					}
					
					if err := s.store.CreateNode(ctx, node); err != nil {
						fmt.Printf("Failed to import node %s: %v\n", pubKey, err)
					} else {
						fmt.Printf("Successfully imported node %s (%s)\n", hostname, ipStr)
						existingKeys[pubKey] = true // Mark as done
					}
				}
			}
		}
	}
}

// getManager returns the WireGuard manager for a network
// If manager doesn't exist but network does, it creates and registers one
func (s *Server) getManager(networkID string) *wireguard.Manager {
	s.managersMu.RLock()
	mgr := s.managers[networkID]
	s.managersMu.RUnlock()
	
	if mgr != nil {
		return mgr
	}
	
	// Manager not found - try to create it from network config
	ctx := context.Background()
	network, err := s.store.GetNetwork(ctx, networkID)
	if err != nil || network == nil || network.InterfaceName == "" {
		return nil
	}
	
	// Create and register manager
	newMgr := wireguard.NewManager(network.InterfaceName)
	if err := newMgr.Init(); err != nil {
		fmt.Printf("Warning: Failed to init WireGuard manager for %s: %v\n", network.Name, err)
		return nil
	}
	
	s.managersMu.Lock()
	// Double-check another goroutine didn't create it
	if existing := s.managers[networkID]; existing != nil {
		s.managersMu.Unlock()
		return existing
	}
	s.managers[networkID] = newMgr
	s.managersMu.Unlock()
	
	fmt.Printf("Lazily initialized WireGuard manager for network %s (%s)\n", network.Name, network.InterfaceName)
	return newMgr
}

// Router returns the HTTP router
func (s *Server) Router() http.Handler {
	return s.router
}

func (s *Server) setupRoutes() {
	// Apply global middleware
	s.router.Use(LoggingMiddleware)
	s.router.Use(APIKeyMiddleware)
	s.router.Use(AuthMiddleware)

	api := s.router.PathPrefix("/api/v1").Subrouter()

	// Networks
	api.HandleFunc("/networks", s.handleListNetworks).Methods("GET")
	api.HandleFunc("/networks", s.handleCreateNetwork).Methods("POST")
	api.HandleFunc("/networks/{id}", s.handleGetNetwork).Methods("GET")
	api.HandleFunc("/networks/{id}", s.handleDeleteNetwork).Methods("DELETE")
	
	// Nodes
	api.HandleFunc("/networks/{networkId}/nodes", s.handleListNodes).Methods("GET")
	api.HandleFunc("/nodes/{id}", s.handleGetNode).Methods("GET")
	api.HandleFunc("/nodes/{id}", s.handleUpdateNode).Methods("PUT", "PATCH")
	api.HandleFunc("/nodes/{id}", s.handleDeleteNode).Methods("DELETE")
	api.HandleFunc("/nodes/{id}/checkin", s.handleNodeCheckIn).Methods("POST")
	
	// WireGuard Config & Utils
	api.HandleFunc("/nodes/{id}/config", s.handleDownloadConfig).Methods("GET")
	api.HandleFunc("/nodes/{id}/qrcode", s.handleGetQRCode).Methods("GET")
	api.HandleFunc("/nodes/{id}/install.sh", s.handleNodeInstallScript).Methods("GET")
	api.HandleFunc("/networks/{networkId}/servers", s.handleCreateServerWithConfig).Methods("POST")

	// Health check
	s.router.HandleFunc("/health", s.handleHealth).Methods("GET")
	
	// Debug endpoint - shows WireGuard interface status
	api.HandleFunc("/debug/wireguard/{networkId}", s.handleDebugWireGuard).Methods("GET")
	
	// Sync endpoint - syncs DB peers to WireGuard interface
	api.HandleFunc("/networks/{networkId}/sync", s.handleSyncPeers).Methods("POST")
	
	// Auth
	s.router.HandleFunc("/api/v1/auth/login", s.handleLogin).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/password", s.handleUpdatePassword).Methods("PUT")

	// User Management
	api.HandleFunc("/users", s.handleListUsers).Methods("GET")
	api.HandleFunc("/users", s.handleCreateUser).Methods("POST")
	api.HandleFunc("/users/{id}", s.handleDeleteUser).Methods("DELETE")

	// Helper for SPA (Single Page Application) serving
	s.router.PathPrefix("/").HandlerFunc(s.handleSPA)
}

func (s *Server) handleSPA(w http.ResponseWriter, r *http.Request) {
	// Security: Prevent directory traversal
	path := r.URL.Path
	if strings.Contains(path, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}

	// Default to dist directory relative to binary
	staticPath := "./dist"
	if envPath := os.Getenv("STATIC_FILES_PATH"); envPath != "" {
		staticPath = envPath
	}

	// Check if file exists
	fullPath := staticPath + path
	if path == "/" {
		fullPath = staticPath + "/index.html"
	}

	info, err := os.Stat(fullPath)
	if os.IsNotExist(err) || info.IsDir() {
		// File not found or is directory -> serve index.html (SPA fallback)
		http.ServeFile(w, r, staticPath+"/index.html")
		return
	}

	// Serve the file
	http.ServeFile(w, r, fullPath)
}


// Response helpers
func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func errorResponse(w http.ResponseWriter, status int, message string) {
	jsonResponse(w, status, map[string]string{"error": message})
}

// Login handler
func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	// Add CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}
	
	// Validate credentials against DB
	user, err := s.store.GetUserByUsername(r.Context(), req.Username)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to check user")
		return
	}
	
	if user == nil {
		errorResponse(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		errorResponse(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	
	// Return token
	jsonResponse(w, http.StatusOK, map[string]string{
		"token":    adminToken,
		"username": adminUsername,
	})
}

// Update Password handler
func (s *Server) handleUpdatePassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username    string `json:"username"`
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate current password first
	user, err := s.store.GetUserByUsername(r.Context(), req.Username)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to check user")
		return
	}
	if user == nil {
		errorResponse(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		errorResponse(w, http.StatusUnauthorized, "invalid old password")
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	// Update password
	if err := s.store.UpdateUserPassword(r.Context(), req.Username, string(hashedPassword)); err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to update password")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]string{"status": "success"})
}

// User Management Handlers

func (s *Server) handleListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := s.store.ListUsers(r.Context())
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to list users")
		return
	}
	// Don't return password hashes
	for _, u := range users {
		u.PasswordHash = ""
	}
	jsonResponse(w, http.StatusOK, users)
}

func (s *Server) handleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}
	
	if req.Username == "" || req.Password == "" {
		errorResponse(w, http.StatusBadRequest, "username and password required")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to hash password")
		return
	}

	user := &models.User{
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
	}

	if err := s.store.CreateUser(r.Context(), user); err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to create user")
		return
	}
	
	user.PasswordHash = "" // Don't return hash
	jsonResponse(w, http.StatusCreated, user)
}

func (s *Server) handleDeleteUser(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	// Prevent deleting the last admin if possible, but for MVP just delete
	if err := s.store.DeleteUser(r.Context(), id); err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to delete user")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// networksOverlap checks if two IP networks overlap
func networksOverlap(a, b *net.IPNet) bool {
	return a.Contains(b.IP) || b.Contains(a.IP)
}

// Network handlers
func (s *Server) handleListNetworks(w http.ResponseWriter, r *http.Request) {
	networks, err := s.store.ListNetworks(r.Context())
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to list networks")
		return
	}
	jsonResponse(w, http.StatusOK, networks)
}

func (s *Server) handleCreateNetwork(w http.ResponseWriter, r *http.Request) {
	var network models.Network
	if err := json.NewDecoder(r.Body).Decode(&network); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Validate CIDR format
	_, newNet, err := net.ParseCIDR(network.CIDR)
	if err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid CIDR format: "+err.Error())
		return
	}

	// Dynamic Allocation Logic
	existing, err := s.store.ListNetworks(r.Context())
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to list networks")
		return
	}

	// Check for CIDR overlap with existing networks
	for _, existingNet := range existing {
		_, existingCIDR, err := net.ParseCIDR(existingNet.CIDR)
		if err != nil {
			continue // Skip invalid existing CIDRs
		}
		
		// Check if networks overlap
		if networksOverlap(newNet, existingCIDR) {
			errorResponse(w, http.StatusConflict, fmt.Sprintf(
				"CIDR %s overlaps with existing network '%s' (%s)",
				network.CIDR, existingNet.Name, existingNet.CIDR,
			))
			return
		}
	}
	
	// 1. Assign Interface Name (wg0, wg1, etc)
	// Find highest 'wgN'
	maxIdx := -1
	usedPorts := make(map[int]bool)
	
	for _, net := range existing {
		if strings.HasPrefix(net.InterfaceName, "wg") {
			var idx int
			if _, err := fmt.Sscanf(net.InterfaceName, "wg%d", &idx); err == nil {
				if idx > maxIdx {
					maxIdx = idx
				}
			}
		}
		if net.ListenPort > 0 {
			usedPorts[net.ListenPort] = true
		}
	}
	
	newIdx := maxIdx + 1
	network.InterfaceName = fmt.Sprintf("wg%d", newIdx)
	
	// 2. Assign Port (Start at 51820)
	port := 51820
	for {
		if !usedPorts[port] {
			break
		}
		port++
	}
	network.ListenPort = port
	
	// 3. Generate WireGuard keys BEFORE saving to DB
	privateKey, publicKey, err := wireguard.GenerateKeys()
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to generate WireGuard keys: "+err.Error())
		return
	}
	
	// Set keys and endpoint on network
	network.ServerPrivateKey = privateKey
	network.ServerPublicKey = publicKey
	network.ServerEndpoint = fmt.Sprintf("%s:%d", wireguard.GetServerEndpoint(), port)
	
	// 4. Save to DB (now with keys)
	if err := s.store.CreateNetwork(r.Context(), &network); err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to create network: "+err.Error())
		return
	}
	
	// 5. Initialize WireGuard Interface
	mgr := wireguard.NewManager(network.InterfaceName)
	if err := mgr.Init(); err != nil {
		fmt.Printf("Warning: WireGuard tools not available: %v\n", err)
	} else {
		// Create WireGuard config with the generated key
		// Calculate server IP (first usable IP in CIDR)
		_, ipNet, _ := net.ParseCIDR(network.CIDR)
		serverIP := ipNet.IP
		serverIP[len(serverIP)-1]++ // .1
		serverAddr := fmt.Sprintf("%s/24", serverIP.String())
		
		if err := mgr.CreateServerConfigWithKey(privateKey, serverAddr, port); err != nil {
			fmt.Printf("Warning: Failed to create WireGuard config for %s: %v\n", network.Name, err)
		} else {
			fmt.Printf("WireGuard interface %s created for network %s\n", network.InterfaceName, network.Name)
			// Bring up the interface
			if err := mgr.Up(); err != nil {
				fmt.Printf("Warning: Failed to bring up %s: %v\n", network.InterfaceName, err)
			}
		}
		
		// Register manager
		s.managersMu.Lock()
		s.managers[network.ID] = mgr
		s.managersMu.Unlock()
	}
	
	jsonResponse(w, http.StatusCreated, network)
}

func (s *Server) handleGetNetwork(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	network, err := s.store.GetNetwork(r.Context(), id)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to get network")
		return
	}
	if network == nil {
		errorResponse(w, http.StatusNotFound, "network not found")
		return
	}
	jsonResponse(w, http.StatusOK, network)
}

func (s *Server) handleDeleteNetwork(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	// Get network first to get interface name
	network, err := s.store.GetNetwork(r.Context(), id)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to get network")
		return
	}
	if network == nil {
		errorResponse(w, http.StatusNotFound, "network not found")
		return
	}
	
	// Prevent deleting Admin Network (wg0)
	if network.InterfaceName == "wg0" {
		errorResponse(w, http.StatusForbidden, "cannot delete Admin Management Network")
		return
	}
	
	// Bring down WireGuard interface
	if network.InterfaceName != "" {
		mgr := wireguard.NewManager(network.InterfaceName)
		if err := mgr.Down(); err != nil {
			fmt.Printf("Warning: Failed to bring down %s: %v\n", network.InterfaceName, err)
		}
		// Remove config file
		configPath := fmt.Sprintf("/etc/wireguard/%s.conf", network.InterfaceName)
		os.Remove(configPath)
		
		// Unregister manager
		s.managersMu.Lock()
		delete(s.managers, id)
		s.managersMu.Unlock()
	}
	
	// Delete from DB
	if err := s.store.DeleteNetwork(r.Context(), id); err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to delete network")
		return
	}
	
	fmt.Printf("Network %s (%s) deleted\n", network.Name, network.InterfaceName)
	w.WriteHeader(http.StatusNoContent)
}

// Node handlers
func (s *Server) handleListNodes(w http.ResponseWriter, r *http.Request) {
	networkID := mux.Vars(r)["networkId"]
	nodes, err := s.store.ListNodes(r.Context(), networkID)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to list nodes")
		return
	}

	// Fetch real-time status from WireGuard
	var peers map[string]wireguard.PeerStatus
	mgr := s.getManager(networkID)
	if mgr != nil {
		p, err := mgr.GetPeers()
		if err == nil {
			peers = p
		}
	}

	for i := range nodes {
		s.enrichNode(nodes[i], peers)
	}

	jsonResponse(w, http.StatusOK, nodes)
}

func (s *Server) handleGetNode(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	node, err := s.store.GetNode(r.Context(), id)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to get node")
		return
	}
	if node == nil {
		errorResponse(w, http.StatusNotFound, "node not found")
		return
	}

	// Enrich with real-time status
	var peers map[string]wireguard.PeerStatus
	mgr := s.getManager(node.NetworkID)
	if mgr != nil {
		p, err := mgr.GetPeers()
		if err == nil {
			peers = p
		}
	}
	s.enrichNode(node, peers)

	jsonResponse(w, http.StatusOK, node)
}

// enrichNode adds real-time info and metadata to a node
func (s *Server) enrichNode(node *models.Node, peers map[string]wireguard.PeerStatus) {
	// 1. Check expiration first
	isExpired := false
	if node.ExpiresAt != nil && !node.ExpiresAt.IsZero() {
		if time.Now().After(*node.ExpiresAt) {
			node.Status = models.NodeStatusExpired
			isExpired = true
			
			// If expired and session exists in WG, remove it
			mgr := s.getManager(node.NetworkID)
			if mgr != nil && peers != nil {
				if _, ok := peers[node.PublicKey]; ok {
					fmt.Printf("Enforcing expiration for node %s (%s)\n", node.Name, node.ID)
					mgr.RemovePeer(node.PublicKey)
				}
			}
		}
	}

	if peers != nil && !isExpired {
		if status, ok := peers[node.PublicKey]; ok {
			// Clean port from endpoint if present
			ep := status.Endpoint
			if idx := strings.LastIndex(ep, ":"); idx != -1 {
				ep = ep[:idx]
			}
			if ep != "(none)" && ep != "" {
				node.PublicIP = ep
			}
			
			node.TransferRx = status.TransferRx
			node.TransferTx = status.TransferTx
			
			
			// Update activity map
			s.activityMu.Lock()
			activity, exists := s.peerActivity[node.PublicKey]
			if !exists {
				activity = &PeerActivity{}
				s.peerActivity[node.PublicKey] = activity
			}
			
			// If we received data since last check, update LastSeen to NOW
			if status.TransferRx > activity.LastRxBytes {
				activity.LastSeen = time.Now()
				activity.LastRxBytes = status.TransferRx
			}
			s.activityMu.Unlock()

			// Determine status
			isOnline := false
			
			// 1. Check traffic activity (fast detection ~30-45s)
			// Clients with PersistentKeepalive=25 will send data every ~25s
			if !activity.LastSeen.IsZero() && time.Since(activity.LastSeen) < 45*time.Second {
				isOnline = true
				// Use the more recent activity time for LastSeen display
				if activity.LastSeen.After(time.Unix(status.LatestHandshakeTime, 0)) {
					node.LastSeen = activity.LastSeen
				}
			}

			// 2. Fallback to handshake (slow detection ~2.5m)
			if !isOnline && status.LatestHandshakeTime > 0 {
				hsTime := time.Unix(status.LatestHandshakeTime, 0)
				// Use handshake time if it's recent
				if time.Since(hsTime) < 150*time.Second {
					isOnline = true
					node.LastSeen = hsTime
				}
			}
			
			if status.LatestHandshakeTime > 0 && node.LastSeen.IsZero() {
				node.LastSeen = time.Unix(status.LatestHandshakeTime, 0)
			}

			if isOnline {
				node.Status = models.NodeStatusOnline
			} else {
				node.Status = models.NodeStatusOffline
			}
		}
	}

	// Dynamic metadata from labels for MVP
	if node.NodeInfo == nil || node.NodeInfo.OS == "" {
		if node.NodeInfo == nil {
			node.NodeInfo = &models.NodeInfo{}
		}
		if os, ok := node.Labels["os"]; ok {
			node.NodeInfo.OS = os
		}
		if arch, ok := node.Labels["arch"]; ok {
			node.NodeInfo.Architecture = arch
		}
		if hostname, ok := node.Labels["hostname"]; ok {
			node.NodeInfo.Hostname = hostname
		}
	}
}

func (s *Server) handleUpdateNode(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	var req struct {
		Name      *string          `json:"name"`
		ExpiresAt *string          `json:"expires_at"` // ISO string or null to remove
		Status    *string          `json:"status"`
		NodeInfo  *models.NodeInfo `json:"node_info"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	node, err := s.store.GetNode(r.Context(), id)
	if err != nil || node == nil {
		errorResponse(w, http.StatusNotFound, "node not found")
		return
	}

	// Update name if provided
	if req.Name != nil && *req.Name != "" {
		node.Name = *req.Name
	}

	// Update expires_at
	if req.ExpiresAt != nil {
		if *req.ExpiresAt == "" {
			// Empty string means remove expiration
			node.ExpiresAt = nil
		} else {
			t, err := time.Parse(time.RFC3339, *req.ExpiresAt)
			if err == nil {
				node.ExpiresAt = &t
			}
		}
	}

	// Update status if provided
	if req.Status != nil {
		newStatus := models.NodeStatus(*req.Status)
		
		// If reactivating an expired node, add it back to WireGuard
		if node.Status == models.NodeStatusExpired && newStatus != models.NodeStatusExpired {
			mgr := s.getManager(node.NetworkID)
			if mgr != nil {
				fmt.Printf("Reactivating node %s, adding to WireGuard\n", node.Name)
				if err := mgr.AddPeer(node.PublicKey, node.VirtualIP.String()+"/32"); err != nil {
					fmt.Printf("Warning: failed to add reactivated peer to WireGuard: %v\n", err)
				}
			}
		}
		
		// If disabling/expiring an active node, remove from WireGuard
		if node.Status != models.NodeStatusExpired && newStatus == models.NodeStatusExpired {
			mgr := s.getManager(node.NetworkID)
			if mgr != nil {
				if err := mgr.RemovePeer(node.PublicKey); err != nil {
					fmt.Printf("Warning: failed to remove peer from WireGuard: %v\n", err)
				}
			}
		}
		
		node.Status = newStatus
	} else {
		// No explicit status change, but check if we're extending an expired node
		if node.Status == models.NodeStatusExpired && req.ExpiresAt != nil && *req.ExpiresAt != "" {
			// Node was expired but got new expiration - reactivate it
			mgr := s.getManager(node.NetworkID)
			if mgr != nil {
				fmt.Printf("Extending expired node %s, reactivating and adding to WireGuard\n", node.Name)
				node.Status = models.NodeStatusPending
				if err := mgr.AddPeer(node.PublicKey, node.VirtualIP.String()+"/32"); err != nil {
					fmt.Printf("Warning: failed to add reactivated peer to WireGuard: %v\n", err)
				}
			}
		}
	}

	// Update NodeInfo if provided
	if req.NodeInfo != nil {
		if node.NodeInfo == nil {
			node.NodeInfo = &models.NodeInfo{}
		}
		if req.NodeInfo.OS != "" {
			node.NodeInfo.OS = req.NodeInfo.OS
		}
		if req.NodeInfo.Architecture != "" {
			node.NodeInfo.Architecture = req.NodeInfo.Architecture
		}
		if req.NodeInfo.Hostname != "" {
			node.NodeInfo.Hostname = req.NodeInfo.Hostname
		}
	}

	if err := s.store.UpdateNode(r.Context(), node); err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to update node")
		return
	}

	// Enrich with real-time data before returning
	mgr := s.getManager(node.NetworkID)
	var peers map[string]wireguard.PeerStatus
	if mgr != nil {
		peers, _ = mgr.GetPeers()
	}
	s.enrichNode(node, peers)
	jsonResponse(w, http.StatusOK, node)
}

func (s *Server) handleDeleteNode(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	
	// Get node first to get public key
	node, err := s.store.GetNode(r.Context(), id)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to fetch node")
		return
	}
	if node == nil {
		errorResponse(w, http.StatusNotFound, "node not found")
		return
	}

	// Remove from WireGuard
	mgr := s.getManager(node.NetworkID)
	if mgr != nil && node.PublicKey != "" {
		if err := mgr.RemovePeer(node.PublicKey); err != nil {
			fmt.Printf("Warning: failed to remove peer from WireGuard: %v\n", err)
			// Continue with deletion anyway
		}
	}

	if err := s.store.DeleteNode(r.Context(), id); err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to delete node")
		return
	}
	jsonResponse(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (s *Server) handleNodeCheckIn(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var req struct {
		NodeInfo *models.NodeInfo  `json:"node_info"`
		Labels   map[string]string `json:"labels"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	node, err := s.store.GetNode(r.Context(), id)
	if err != nil || node == nil {
		errorResponse(w, http.StatusNotFound, "node not found")
		return
	}

	// Update NodeInfo if provided
	if req.NodeInfo != nil {
		if node.NodeInfo == nil {
			node.NodeInfo = req.NodeInfo
		} else {
			if req.NodeInfo.OS != "" {
				node.NodeInfo.OS = req.NodeInfo.OS
			}
			if req.NodeInfo.Architecture != "" {
				node.NodeInfo.Architecture = req.NodeInfo.Architecture
			}
			if req.NodeInfo.Hostname != "" {
				node.NodeInfo.Hostname = req.NodeInfo.Hostname
			}
		}
	}

	// Update/Merge Labels
	if req.Labels != nil {
		if node.Labels == nil {
			node.Labels = make(map[string]string)
		}
		for k, v := range req.Labels {
			node.Labels[k] = v
		}
	}

	if err := s.store.UpdateNode(r.Context(), node); err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to update node info")
		return
	}

	jsonResponse(w, http.StatusOK, node)
}






// Health check
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, http.StatusOK, map[string]string{
		"status":  "healthy",
		"version": "0.1.0",
	})
}

// Debug WireGuard - shows interface status and registered peers
func (s *Server) handleDebugWireGuard(w http.ResponseWriter, r *http.Request) {
	networkID := mux.Vars(r)["networkId"]
	
	result := map[string]interface{}{
		"network_id": networkID,
	}
	
	// Get network info
	network, err := s.store.GetNetwork(r.Context(), networkID)
	if err != nil || network == nil {
		result["error"] = "network not found"
		jsonResponse(w, http.StatusNotFound, result)
		return
	}
	
	result["network_name"] = network.Name
	result["interface_name"] = network.InterfaceName
	result["server_public_key"] = network.ServerPublicKey
	result["server_endpoint"] = network.ServerEndpoint
	
	// Check manager
	s.managersMu.RLock()
	mgr := s.managers[networkID]
	s.managersMu.RUnlock()
	
	result["manager_registered"] = mgr != nil
	
	// Get peers from WireGuard
	if mgr != nil {
		peers, err := mgr.GetPeers()
		if err != nil {
			result["wg_error"] = err.Error()
		} else {
			result["wg_peers_count"] = len(peers)
			peerList := []map[string]interface{}{}
			for pubKey, status := range peers {
				peerList = append(peerList, map[string]interface{}{
					"public_key":  pubKey,
					"endpoint":    status.Endpoint,
					"allowed_ips": status.AllowedIPs,
					"transfer_rx": status.TransferRx,
					"transfer_tx": status.TransferTx,
				})
			}
			result["wg_peers"] = peerList
		}
	}
	
	// Get DB nodes for comparison
	nodes, err := s.store.ListNodes(r.Context(), networkID)
	if err == nil {
		result["db_nodes_count"] = len(nodes)
		nodeList := []map[string]interface{}{}
		for _, n := range nodes {
			nodeList = append(nodeList, map[string]interface{}{
				"id":         n.ID,
				"name":       n.Name,
				"public_key": n.PublicKey,
				"virtual_ip": n.VirtualIP.String(),
			})
		}
		result["db_nodes"] = nodeList
	}
	
	jsonResponse(w, http.StatusOK, result)
}

// handleSyncPeers syncs all DB nodes to WireGuard interface
func (s *Server) handleSyncPeers(w http.ResponseWriter, r *http.Request) {
	networkID := mux.Vars(r)["networkId"]
	
	// Get manager
	mgr := s.getManager(networkID)
	if mgr == nil {
		errorResponse(w, http.StatusInternalServerError, "WireGuard manager not available for this network")
		return
	}
	
	// Get all nodes from DB
	nodes, err := s.store.ListNodes(r.Context(), networkID)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to list nodes: "+err.Error())
		return
	}
	
	// Get current WireGuard peers
	currentPeers, err := mgr.GetPeers()
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, "failed to get WireGuard peers: "+err.Error())
		return
	}
	
	added := 0
	skipped := 0
	errors := []string{}
	
	for _, node := range nodes {
		if node.PublicKey == "" {
			continue
		}
		
		// Check if already in WireGuard
		if _, exists := currentPeers[node.PublicKey]; exists {
			skipped++
			continue
		}
		
		// Add to WireGuard
		allowedIPs := node.VirtualIP.String() + "/32"
		if err := mgr.AddPeer(node.PublicKey, allowedIPs); err != nil {
			errors = append(errors, fmt.Sprintf("failed to add %s: %v", node.Name, err))
		} else {
			added++
			fmt.Printf("[SYNC] Added peer %s (%s) to WireGuard\n", node.Name, node.PublicKey[:16]+"...")
		}
	}
	
	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"added":   added,
		"skipped": skipped,
		"errors":  errors,
		"total":   len(nodes),
	})
}

// Middleware

// AuthMiddleware validates authentication
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		// Skip auth for health check and login
		if r.URL.Path == "/health" ||
		   strings.HasSuffix(r.URL.Path, "/login") {
			next.ServeHTTP(w, r)
			return
		}
		
		auth := r.Header.Get("Authorization")
		if auth == "" {
			errorResponse(w, http.StatusUnauthorized, "missing authorization header")
			return
		}
		
		if !strings.HasPrefix(auth, "Bearer ") {
			errorResponse(w, http.StatusUnauthorized, "invalid authorization header")
			return
		}
		
		token := strings.TrimPrefix(auth, "Bearer ")
		if subtle.ConstantTimeCompare([]byte(token), []byte(adminToken)) != 1 {
			errorResponse(w, http.StatusUnauthorized, "invalid token")
			return
		}
		
		next.ServeHTTP(w, r)
	})
}

// APIKeyMiddleware validates the X-API-Key header
func APIKeyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip if no key is configured (dev mode)
		if apiKey == "" {
			next.ServeHTTP(w, r)
			return
		}

		// Add CORS headers for OPTIONS
		if r.Method == "OPTIONS" {
			// Headers are handled in AuthMiddleware or should be here too if this runs first
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
			w.WriteHeader(http.StatusOK)
			return
		}

		// Public paths that don't need API Key
		if r.URL.Path == "/health" ||
		   strings.HasSuffix(r.URL.Path, "/login") {
			next.ServeHTTP(w, r)
			return
		}

		clientKey := r.Header.Get("X-API-Key")
		if subtle.ConstantTimeCompare([]byte(clientKey), []byte(apiKey)) != 1 {
			errorResponse(w, http.StatusUnauthorized, "invalid or missing api key")
			return
		}

		next.ServeHTTP(w, r)
	})
}

// LoggingMiddleware logs requests
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		duration := time.Since(start)
		
		// Log request
		_ = duration // TODO: proper logging
	})
}
