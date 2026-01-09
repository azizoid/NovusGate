# NovusMesh Server - Developer Guide

## Overview
**NovusMesh Server** is the core component responsible for managing the WireGuard mesh network overlay. It handles peer coordination, configuration distribution, key management, and API access for the dashboard. It is written in **Go** and designed to be high-performance and cloud-native.

## Architecture

### Tech Stack
- **Language:** Go 1.21+
- **Database:** SQLite (embedded via CGO) or PostgreSQL (supported via drivers)
- **VPN Protocol:** WireGuard (using `wg-quick` and kernel modules)
- **API:** REST/JSON over HTTP
- **Auth:** JWT (JSON Web Tokens) for API security

### Directory Structure
```
server/
├── cmd/
│   └── novusmesh-server/  # Main entry point (main.go)
├── internal/
│   ├── controlplane/      # Business logic & Database layer
│   │   ├── api/           # REST API handlers
│   │   ├── db/            # Database storage implementations
│   │   └── config/        # Environment variable parsing
│   ├── wireguard/         # WireGuard interface management
│   └── shared/            # Common utilities
├── deployments/           # Docker and systemd configs
└── Makefile               # Build scripts
```

## Core Modules

### 1. Control Plane
Located in `internal/controlplane`, this module acts as the "brain".
- **Peers:** Manages the lifecycle of mesh nodes (Create, Delete, Update IP).
- **IPAM:** Handles IP address allocation for the WireGuard interface (e.g., `10.10.0.x`).
- **Config Distribution:** Generates and serves valid WireGuard configurations for clients.

### 2. WireGuard Manager
Located in `internal/wireguard`.
- **Interface Management:** Creates and configures the `wg0` interface.
- **Key Generation:** Handles Private/Public key generation for the server itself.
- **Peer Sync:** Synchronizes the database state with the actual kernel WireGuard interface.

### 3. API Layer
Exposes endpoints for the Web Dashboard and Installer.
- `GET /api/v1/nodes`: List active peers.
- `POST /api/v1/nodes`: Enroll a new peer.
- `GET /api/v1/config`: Get the server's own public configuration.

## Development Setup

### Prerequisites
- Go 1.21+ installed.
- GCC (required for SQLite CGO).
- WireGuard tools (`wg`, `wg-quick`) installed on the host.

### Running Locally
1. **Clone & Enter:**
   ```bash
   cd server
   ```

2. **Configure Envoronment:**
   Create a `.env` file or export variables:
   ```bash
   export DB_PASSWORD="change_me"
   export JWT_SECRET="dev_secret_123"
   export API_KEY="dev_api_key"
   ```

3. **Run:**
   ```bash
   go run ./cmd/novusmesh-server serve
   ```

### Building
Use the Makefile for easy builds:
```bash
make build       # Builds binary to bin/novusmesh-server
make docker      # Builds Docker image
```

## Contributing
- **Code Style:** Follow standard `gofmt` and Go idioms.
- **Testing:** Add unit tests for logic in `internal/`.
- **Migration:** Database schema changes must be added as SQL migration files.
