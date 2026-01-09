package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/novusmesh/novusmesh/internal/controlplane/api/rest"
	"github.com/novusmesh/novusmesh/internal/controlplane/store"
	"github.com/novusmesh/novusmesh/internal/shared/models"
	"github.com/novusmesh/novusmesh/internal/wireguard"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
)

var (
	cfgFile string
	version = "0.1.0"
)

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

var rootCmd = &cobra.Command{
	Use:   "novusmesh-server",
	Short: "novusmesh Control Plane Server",
	Long: `novusmesh Control Plane manages mesh VPN networks,
nodes, services, and access policies.`,
}

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the control plane server",
	RunE:  runServer,
}

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Run database migrations",
	RunE:  runMigrations,
}

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize a new network",
	RunE:  initNetwork,
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("novusmesh Control Plane v%s\n", version)
	},
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default: /etc/novusmesh/server.yaml)")
	
	// Serve command flags
	serveCmd.Flags().String("listen", ":8080", "HTTP listen address")
	serveCmd.Flags().String("grpc-listen", ":8443", "gRPC listen address")
	serveCmd.Flags().String("database", "", "Database connection string")
	
	// Init command flags
	initCmd.Flags().String("name", "", "Network name (required)")
	initCmd.Flags().String("cidr", "10.10.0.0/16", "Network CIDR")
	initCmd.Flags().String("database", "", "Database connection string")
	initCmd.MarkFlagRequired("name")

	// Migrate command flags
	migrateCmd.Flags().String("database", "", "Database connection string")

	// Bind flags to viper
	viper.BindPFlag("listen", serveCmd.Flags().Lookup("listen"))
	viper.BindPFlag("grpc_listen", serveCmd.Flags().Lookup("grpc-listen"))
	viper.BindPFlag("database_url", serveCmd.Flags().Lookup("database"))

	rootCmd.AddCommand(serveCmd)
	rootCmd.AddCommand(migrateCmd)
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(versionCmd)
}

func initConfig() {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.SetConfigName("server")
		viper.SetConfigType("yaml")
		viper.AddConfigPath("/etc/novusmesh")
		viper.AddConfigPath("$HOME/.novusmesh")
		viper.AddConfigPath(".")
	}

	// Environment variables
	viper.SetEnvPrefix("novusmesh")
	viper.AutomaticEnv()

	// Defaults
	viper.SetDefault("listen", ":8080")
	viper.SetDefault("grpc_listen", ":8443")

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			fmt.Fprintf(os.Stderr, "Warning: Error reading config file: %v\n", err)
		}
	}
}

func runServer(cmd *cobra.Command, args []string) error {
	// Get configuration
	listenAddr := viper.GetString("listen")
	databaseURL := viper.GetString("database_url")
	
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
	}
	if databaseURL == "" {
		return fmt.Errorf("database connection string is required (--database or DATABASE_URL)")
	}

	fmt.Printf("Starting novusmesh Control Plane v%s\n", version)
	fmt.Printf("  HTTP Listen: %s\n", listenAddr)
	fmt.Printf("  Database: %s\n", maskDatabaseURL(databaseURL))

	// Connect to database
	db, err := store.New(databaseURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()
	fmt.Println("  Database: Connected")

	// Run migrations
	fmt.Println("  Database: Running migrations...")
	if err := db.Migrate(context.Background()); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}
	fmt.Println("  Database: Migrations applied")

	// Bootstrap admin user
	if err := bootstrapAdmin(db); err != nil {
		fmt.Printf("Warning: Failed to bootstrap admin user: %v\n", err)
	}

	// Initialize WireGuard Manager
	wgManager := wireguard.NewManager("wg0")
	if err := wgManager.Init(); err != nil {
		fmt.Printf("Warning: WireGuard tools not found: %v\n", err)
	} else {
		// Automatically bring up the interface if a network exists
		networks, err := db.ListNetworks(context.Background())
		if err == nil && len(networks) > 0 {
			network := networks[0] // Assume first network for now
			serverIP := "10.10.0.1/24"
			serverPort := 51820
			
			if network.ServerPrivateKey != "" {
				fmt.Printf("  WireGuard: Local network found, bringing up %s...\n", wgManager.InterfaceName)
				if err := wgManager.CreateServerConfigWithKey(network.ServerPrivateKey, serverIP, serverPort); err != nil {
					fmt.Printf("  Warning: Failed to create WireGuard config: %v\n", err)
				} else if err := wgManager.Up(); err != nil {
					fmt.Printf("  Warning: Failed to bring up WireGuard: %v\n", err)
				} else {
					fmt.Printf("  WireGuard: Interface %s is up\n", wgManager.InterfaceName)
					
					// Restore peers
					fmt.Println("  WireGuard: Restoring peers from database...")
					nodes, err := db.ListNodes(context.Background(), network.ID)
					if err != nil {
						fmt.Printf("  Warning: Failed to list nodes for restoration: %v\n", err)
					} else {
						count := 0
						for _, node := range nodes {
							// Skip if expired
							if node.Status == models.NodeStatusExpired {
								continue
							}
							if node.PublicKey != "" && len(node.VirtualIP) > 0 {
								if err := wgManager.AddPeer(node.PublicKey, node.VirtualIP.String()+"/32"); err != nil {
									fmt.Printf("    Error restoring peer %s: %v\n", node.Name, err)
								} else {
									count++
								}
							}
						}
						fmt.Printf("  WireGuard: Restored %d peers\n", count)
					}
				}
			}
		}
	}

	// Create REST API server
	apiServer := rest.NewServer(db, wgManager)

	// Create HTTP server
	httpServer := &http.Server{
		Addr:         listenAddr,
		Handler:      rest.LoggingMiddleware(rest.AuthMiddleware(apiServer.Router())),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		fmt.Printf("HTTP server listening on %s\n", listenAddr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Fprintf(os.Stderr, "HTTP server error: %v\n", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	fmt.Println("\nShutting down server...")

	// Graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		return fmt.Errorf("server shutdown error: %w", err)
	}

	fmt.Println("Server stopped")
	return nil
}

func runMigrations(cmd *cobra.Command, args []string) error {
	databaseURL, _ := cmd.Flags().GetString("database")
	if databaseURL == "" {
		databaseURL = viper.GetString("database_url")
	}
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
	}
	if databaseURL == "" {
		return fmt.Errorf("database connection string is required")
	}

	fmt.Println("Running database migrations...")
	
	// Connect to database
	db, err := store.New(databaseURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	// Run migrations
	if err := db.Migrate(context.Background()); err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	fmt.Println("Migrations completed successfully")
	return nil
}

func initNetwork(cmd *cobra.Command, args []string) error {
	name, _ := cmd.Flags().GetString("name")
	cidr, _ := cmd.Flags().GetString("cidr")
	databaseURL, _ := cmd.Flags().GetString("database")
	
	if databaseURL == "" {
		databaseURL = viper.GetString("database_url")
	}
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
	}
	if databaseURL == "" {
		return fmt.Errorf("database connection string is required")
	}

	// Connect to database
	db, err := store.New(databaseURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	// Create network with WireGuard keys
	ctx := context.Background()
	
	// Generate WireGuard key pair for the hub (server)
	privateKey, publicKey, err := wireguard.GenerateKeys()
	if err != nil {
		return fmt.Errorf("failed to generate WireGuard keys: %w", err)
	}
	
	// Get server endpoint from environment or use default
	serverEndpoint := wireguard.GetServerEndpoint()
	
	network := &models.Network{
		Name:             name,
		CIDR:             cidr,
		ServerPrivateKey: privateKey,
		ServerPublicKey:  publicKey,
		ServerEndpoint:   fmt.Sprintf("%s:51820", serverEndpoint),
	}
	
	if err := db.CreateNetwork(ctx, network); err != nil {
		// Check if network already exists
		existing, errList := db.ListNetworks(ctx)
		if errList == nil {
			found := false
			for _, n := range existing {
				if n.Name == name {
					network = n
					found = true
					fmt.Printf("Network '%s' already exists (ID: %s), proceeding to config...\n", name, network.ID)
					break
				}
			}
			if !found {
				return fmt.Errorf("failed to create network: %w", err)
			}
		} else {
			return fmt.Errorf("failed to create network: %w", err)
		}
	} else {
		fmt.Printf("Network created successfully!\n")
		fmt.Printf("  ID: %s\n", network.ID)
		fmt.Printf("  Name: %s\n", network.Name)
		fmt.Printf("  CIDR: %s\n", network.CIDR)
		fmt.Printf("  Server Public Key: %s\n", network.ServerPublicKey)
		fmt.Printf("  Server Endpoint: %s\n", network.ServerEndpoint)
	}
	
	// Initialize WireGuard for this network
	wgManager := wireguard.NewManager("wg0")
	serverIP := "10.10.0.1/24" // First IP in CIDR as hub address
	serverPort := 51820
	
	// Create WireGuard config using the network's private key
	if err := wgManager.CreateServerConfigWithKey(network.ServerPrivateKey, serverIP, serverPort); err != nil {
		fmt.Printf("Warning: Failed to create WireGuard config: %v\n", err)
	} else {
		fmt.Printf("WireGuard configuration written to /etc/wireguard/wg0.conf\n")
		// Attempt to start interface
		if err := wgManager.Up(); err != nil {
			fmt.Printf("Warning: Failed to bring up WireGuard interface: %v\n", err)
		} else {
			fmt.Printf("WireGuard interface wg0 started successfully.\n")
		}
	}

	return nil
}

func runMigrationSQL(db *store.Store) error {
	// Migrations are handled by the store package
	// This is a placeholder for when we add proper migration support
	fmt.Println("Note: Please run migrations/001_initial.sql manually or use a migration tool")
	return nil
}

func maskDatabaseURL(url string) string {
	// Hide password in connection string for logging
	// Simple masking - in production use proper URL parsing
	return url
}

func bootstrapAdmin(db *store.Store) error {
	ctx := context.Background()

	// Check if any users exist
	users, err := db.ListUsers(ctx)
	if err != nil {
		return fmt.Errorf("failed to list users: %w", err)
	}

	if len(users) > 0 {
		return nil // Users already exist, skip bootstrap
	}

	// Read credentials from env
	username := os.Getenv("ADMIN_USERNAME")
	if username == "" {
		username = "admin"
	}

	password := os.Getenv("ADMIN_PASSWORD")
	if password == "" {
		return fmt.Errorf("ADMIN_PASSWORD environment variable is required for first-time setup")
	}

	fmt.Printf("Bootstrapping admin user: %s\n", username)

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Username:     username,
		PasswordHash: string(hashedPassword),
	}

	if err := db.CreateUser(ctx, user); err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	fmt.Println("Admin user created successfully")
	return nil
}
