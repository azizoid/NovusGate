# NovusMesh Installer - User Guide

## Introduction
Welcome to the NovusMesh management interface. This tool allows you to easily install, manage, and monitor your NovusMesh VPN servers from a simple web dashboard.

## Getting Started

### Prerequisites
- A remote Linux server (Ubuntu/Debian recommended).
- Root access (IP address, username, and password) to that server.
- The NovusMesh Installer running on your local machine.

### Accessing the Dashboard
1. Ensure the installer container is running.
2. Open your web browser and navigate to: `http://localhost:3017`

## Managed Servers

### Adding a Server
1. Click **+ New Server** in the sidebar.
2. Enter a **Name** (e.g., "Production VPN").
3. Enter the **Host (IP)** of your Linux server.
4. Enter the **Username** (usually `root`) and **Password**.
   - *Note: SSH Keys are supported if configured on your host, but password is the standard method here.*
5. Click **Add**.

### Viewing Status
Click on any server in the sidebar to view its dashboard. You will see:
- **Installation Status:** Checked automatically.
- **Resources:** Free Disk and RAM.
- **Docker Containers:** List of running services on that server.

## Operations

### 📦 Install NovusMesh Server
Use this to set up a fresh server.
1. Click **Install NovusMesh Server**.
2. Select "Local" if prompted (uses the installer's built-in package).
3. The terminal window will open showing the installation progress.
4. **IMPORTANT:** At the end, save the **Security Keys** (Admin Password, API Key, etc.) shown in the popup. These are generated once!

### 🚀 Update (Smart)
Use this to update an existing server to the latest version.
- **Safe:** It preserves your database, users, and configuration (`.env`).
- **Automatic:** Handles container recreation and database migrations.

### 🔄 Reinstall
**WARNING:** This is a destructive action for system files, but tries to preserve data.
- Use only if the server is broken.
- It will stop containers, clean system files, and re-deploy.

### 🗑️ Uninstall
**DANGER:** Completely removes NovusMesh, including all data, users, and configuration from the remote server.

## Troubleshooting

### "Server not found"
- Check if the IP address is correct.
- Ensure the server is powered on and accessible via SSH.

### "Authentication failed"
- Verify the root password.
- Ensure SSH root login is enabled on the server (`PermitRootLogin yes` in `/etc/ssh/sshd_config`).

### Installation Stuck
- Check your internet connection.
- View the **Output Log** for specific error messages (e.g., "apt-get failed").

## Support
Developed by [Ali Zeynalli](https://github.com/Ali7Zeynalli).
For issues, please visit the GitHub repository.
