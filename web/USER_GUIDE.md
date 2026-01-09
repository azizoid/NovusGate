# NovusMesh Web Dashboard - User Guide

## Introduction
The Web Dashboard is your visual command center for the NovusMesh VPN. It allows you to add devices, monitor connections, and manage your private network from any browser.

## Getting Started

### Access
By default, the dashboard is available at:
- **URL:** `http://YOUR_SERVER_IP` (or domain)
- **Login:** Use the credentials generated during installation.

## Features

### 📊 Dashboard
- **Overview:** See total active, pending, and offline nodes.
- **Quick Stats:** View the ratio of online nodes vs total nodes.
- **Recent Activity:** A quick list of the most recently added or active nodes.

### 🖥️ Nodes (Peers) Management
This is where you manage devices connected to your VPN.

#### Adding a Device (Peer)
1. Go to the **Nodes** tab.
2. Click the **+ Create Peer** button.
3. **Peer Name:** Give your device a friendly name (e.g., "Ali's Laptop", "Office PC").
4. **Expiration:** Select how long this device should have access:
   - **Forever:** No time limit.
   - **1h / 1d / 1w:** Temporary access (useful for guests).
   - **Custom:** Set a specific date and time for access to expire.
5. Click **Create & Download Config**.
6. **QR Code / Config:** A modal will appear. 
   - **Mobile:** Scan the QR code with the WireGuard app.
   - **Desktop:** Download the `.conf` file and import it into WireGuard.

#### Editing a Device
- Click the **Edit** (pencil) icon next to any node.
- **Name:** Rename the device.
- **Status:** Manually **Disable** or **Activate** a peer (stops access immediately).
- **Expiration:** Extend access time or remove limits.
- **Device Info:** Manually update OS, Architecture, or Hostname for better tracking.

#### Deleting a Device
- Click the **Delete** (trash bin) icon to permanently remove a peer and revoke its access.

### ⚙️ Settings (User Management)
This section is for managing access to the dashboard itself.

#### Change Password
- **Current Password:** Enter your current login password.
- **New Password:** Set a new secure password for your account.

#### User Management (Admin Only)
- **Add User:** Create additional admin accounts for other team members.
- **Delete User:** Remove access for specific users (Note: The main `admin` user cannot be deleted).

## Security
- **Logout:** Always use the **Log Out** button in the sidebar bottom left corner when finished.
- **HTTPS:** In production, it is highly recommended to serve this dashboard behind a reverse proxy (like Nginx) with SSL enabled.

## Support
Developed by [Ali Zeynalli](https://github.com/Ali7Zeynalli).
