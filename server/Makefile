.PHONY: all build build-server clean test lint fmt run-server docker-build docker-up docker-down migrate help

# Variables
VERSION ?= 0.1.0
COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')
LDFLAGS := -ldflags "-X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.buildTime=$(BUILD_TIME)"

GO := go
GOFLAGS := -v

# Output directories
BIN_DIR := bin
DIST_DIR := dist

# Default target
all: build

# Build all binaries
build: build-server

# Build control plane server binary
build-server:
	@echo "Building control plane server..."
	@mkdir -p $(BIN_DIR)
	$(GO) build $(GOFLAGS) $(LDFLAGS) -o $(BIN_DIR)/novusmesh-server ./cmd/control-plane

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf $(BIN_DIR) $(DIST_DIR)
	@go clean

# Run tests
test:
	@echo "Running tests..."
	$(GO) test -v -race -cover ./...

# Run tests with coverage report
test-coverage:
	@echo "Running tests with coverage..."
	$(GO) test -v -race -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

# Run linter
lint:
	@echo "Running linter..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run ./...; \
	else \
		echo "golangci-lint not installed. Run: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

# Format code
fmt:
	@echo "Formatting code..."
	$(GO) fmt ./...
	@if command -v goimports >/dev/null 2>&1; then \
		goimports -w .; \
	fi

# Run control plane server (development)
run-server: build-server
	@echo "Starting control plane server..."
	./$(BIN_DIR)/novusmesh-server serve --database "postgres://novusmesh:novusmesh_secret@localhost:5432/novusmesh?sslmode=disable"



# Docker targets
docker-build:
	@echo "Building Docker images..."
	docker build -f deployments/docker/Dockerfile.control-plane -t novusmesh/control-plane:$(VERSION) .


docker-up:
	@echo "Starting Docker Compose stack..."
	docker-compose -f deployments/docker/docker-compose.yml up -d

docker-down:
	@echo "Stopping Docker Compose stack..."
	docker-compose -f deployments/docker/docker-compose.yml down

docker-logs:
	docker-compose -f deployments/docker/docker-compose.yml logs -f

# Database targets
migrate:
	@echo "Running database migrations..."
	psql "postgres://novusmesh:novusmesh_secret@localhost:5432/novusmesh?sslmode=disable" -f migrations/001_initial.sql

db-reset:
	@echo "Resetting database..."
	docker-compose -f deployments/docker/docker-compose.yml exec -T postgres psql -U novusmesh -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@make migrate

# Initialize new network
init-network:
	@echo "Initializing new network..."
	./$(BIN_DIR)/novusmesh-server init --name "default" --cidr "10.10.0.0/16" --database "postgres://novusmesh:novusmesh_secret@localhost:5432/novusmesh?sslmode=disable"

# Development setup
dev-setup:
	@echo "Setting up development environment..."
	$(GO) mod download
	$(GO) install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	$(GO) install golang.org/x/tools/cmd/goimports@latest

# Generate protobuf files
proto:
	@echo "Generating protobuf files..."
	@if command -v protoc >/dev/null 2>&1; then \
		protoc --go_out=. --go-grpc_out=. internal/shared/proto/*.proto; \
	else \
		echo "protoc not installed"; \
	fi

# Cross-compile for multiple platforms
release: clean
	@echo "Building release binaries..."
	@mkdir -p $(DIST_DIR)
	
	# Linux AMD64
	GOOS=linux GOARCH=amd64 $(GO) build $(LDFLAGS) -o $(DIST_DIR)/novusmesh-server-linux-amd64 ./cmd/control-plane
	
	# Linux ARM64
	GOOS=linux GOARCH=arm64 $(GO) build $(LDFLAGS) -o $(DIST_DIR)/novusmesh-server-linux-arm64 ./cmd/control-plane
	
	# Darwin AMD64
	GOOS=darwin GOARCH=amd64 $(GO) build $(LDFLAGS) -o $(DIST_DIR)/novusmesh-server-darwin-amd64 ./cmd/control-plane
	
	# Darwin ARM64 (Apple Silicon)
	GOOS=darwin GOARCH=arm64 $(GO) build $(LDFLAGS) -o $(DIST_DIR)/novusmesh-server-darwin-arm64 ./cmd/control-plane
	
	@echo "Release binaries in $(DIST_DIR)/"



# Help target
help:
	@echo "novusmesh Makefile"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all            Build control plane server binary (default)"
	@echo "  build          Build control plane server binary"
	@echo "  build-server   Build control plane server binary"
	@echo "  clean          Clean build artifacts"
	@echo "  test           Run tests"
	@echo "  test-coverage  Run tests with coverage report"
	@echo "  lint           Run linter"
	@echo "  fmt            Format code"
	@echo "  run-server     Run control plane server (dev)"
	@echo "  docker-build   Build Docker images"
	@echo "  docker-up      Start Docker Compose stack"
	@echo "  docker-down    Stop Docker Compose stack"
	@echo "  docker-logs    Follow Docker Compose logs"
	@echo "  migrate        Run database migrations"
	@echo "  db-reset       Reset database"
	@echo "  init-network   Initialize a new network"
	@echo "  dev-setup      Setup development environment"
	@echo "  release        Build release binaries for all platforms"
	@echo "  help           Show this help message"
