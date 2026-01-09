# NovusMesh Installer - Developer Guide

## Overview
The **NovusMesh Installer** is a lightweight, standalone management tool designed to simplify the deployment, update, and maintenance of the NovusMesh Server on remote Linux machines via SSH. It acts as a "control center" that runs locally (usually via Docker) and connects to your servers to perform operations.

## Architecture

### Tech Stack
- **Backend:** Node.js (Express.js)
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Communication:** SSH (via `ssh2` library)
- **Deployment:** Docker & Docker Compose

### File Structure
```
installer/
├── server.js              # Main backend logic & API
├── public/
│   └── index.html         # Single-page frontend application
├── Dockerfile             # Container definition
├── docker-compose.yml     # Orchestration config
└── data/                  # Persisted data (servers list)
```

## Core Components

### 1. Backend (`server.js`)
The backend exposes a REST API to manage servers and perform operations.
- **`GET /api/servers`**: Lists all saved servers.
- **`POST /api/servers`**: Adds a new server credential.
- **`GET /api/servers/:id/status`**: Checks server health, Docker status, and system resources.
- **`POST /api/servers/:id/install`**: Executes the installation/update scripts via SSH.
- **`GET /api/servers/:id/docker`**: Retrives list of Docker containers.

**Key Features:**
- **Embedded Shell Scripts:** All installation logic (Install, Update, Reinstall, Uninstall) is embedded as constant strings (`INSTALL_SCRIPT_LOCAL`, `UPDATE_SCRIPT`, etc.) within `server.js`. reliable execution.
- **SSH Streaming:** The installer streams stdout/stderr from the remote server back to the frontend in real-time, allowing users to see the progress.
- **Credential Parsing:** It automatically parses sensitive output (like generated passwords) from the stream and presents them UI.

### 2. Frontend (`public/index.html`)
A single-file application that interacts with the backend.
- **No Build Step:** Uses standard web technologies (no React/Vue build process required for the installer itself).
- **Real-time Logs:** Uses the Fetch API with `ReadableStream` to display live logs from the backend.
- **Responsive Design:** Includes a sticky sidebar and responsive layout for better usability.

## Workflows

### Installation Flow
1. **Connect:** Backend establishes SSH connection using provided credentials.
2. **Transfer:** It uploads the `novusmesh.tar.gz` (if available locally) or pulls scripts.
3. **Execute:** Runs the `INSTALL_SCRIPT_LOCAL` on the remote machine.
   - Installs Docker & Docker Compose.
   - Generates security keys (API Key, JWT Secret).
   - Starts the NovusMesh services.
4. **report:** Streams logs back to UI and extracts credentials.

### Smart Update Flow
1. **Preserve:** The script specifically excludes `.env` and `data/` directories from being overwritten.
2. **Update:** Replaces binary files and container images.
3. **Migrate:** Runs database migrations automatically without data loss.

## Development Setup

1. **Install Dependencies:**
   ```bash
   cd installer
   npm install
   ```

2. **Run Locally:**
   ```bash
   node server.js
   ```
   Access at `http://localhost:3000`

3. **Run via Docker:**
   ```bash
   docker-compose up -d --build
   ```

## Contributing
- **Localization:** Ensure all new strings are in English.
- **Branding:** Maintain "NovusMesh" branding and footer attribution.
- **Security:** Never log passwords or private keys to the persistent console, strictly verify SSH host keys in production.
