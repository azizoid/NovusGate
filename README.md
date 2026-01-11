# NovusMesh

🚀 **Build your own private VPN network — without SaaS lock-in or painful configurations.**

**NovusMesh** is a modern, fully self-hosted **VPN control plane** built on top of the **WireGuard®** protocol.  
It allows you to securely connect servers, cloud instances, and personal devices using a clean **Hub-and-Spoke architecture**, all managed from a single web dashboard.

Whether you're running production infrastructure or simply want full ownership of your private network, **NovusMesh gives you clarity, security, and control**.

![NovusMesh Dashboard](web/public/novusmesh_banner.png)

---

## ✨ Why NovusMesh?

Most VPN solutions today are either:
- ❌ SaaS-based black boxes  
- ❌ Hard to manage at scale  
- ❌ Overkill for small teams  
- ❌ Or painful to self-host  

**NovusMesh was built to be different.**

It focuses on:
- **Ownership over convenience**
- **Simplicity over complexity**
- **Transparency over abstraction**

You run it.  
You control it.  
Your network — your rules.

---

## 🚀 Key Features

- **Multi-Network Architecture**  
  Create multiple isolated VPN networks, each with its own WireGuard interface, subnet, and port.

- **Hub-and-Spoke Architecture**  
  Centralized control where all traffic is securely routed through your server.

- **Modern Web Dashboard**  
  Manage networks, nodes, inspect traffic, and control your VPN using a sleek React-based UI.

- **One-Click Installer**  
  Deploy and update NovusMesh effortlessly using a dedicated Docker-based installer.

- **Safe & Smart Updates**  
  Upgrade your system without losing configuration or network state.

- **Secure by Default**  
  WireGuard cryptography, JWT authentication, and API key–based internal communication.

- **Multi-Platform Client Support**  
  QR codes for mobile, config downloads for desktop, one-line install scripts for Linux.

---

## 👥 Who is NovusMesh for?

- **SysAdmins** managing secure access between servers and data centers  
- **DevOps Engineers** connecting infrastructure across environments  
- **Developers** building internal or self-hosted platforms  
- **Privacy-conscious users** who want full control over their VPN setup  

If you value **self-hosting, security, and simplicity**, NovusMesh is for you.

---

## 🧠 How It Works (High-Level)

1. A **central server** acts as the control plane  
2. Create **isolated networks** with unique subnets (10.x.x.0/24)
3. Devices register and authenticate securely  
4. WireGuard tunnels are established automatically  
5. Traffic is routed securely through the control plane  

No hidden magic.  
No vendor lock-in.  
Just clean networking.

---

## 📂 System Architecture

NovusMesh is designed as a **modular system**, separating control, interface, and deployment for maximum flexibility and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                     NovusMesh Server                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Network 1  │  │  Network 2  │  │  Network N  │         │
│  │   wg0:51820 │  │   wg1:51821 │  │   wgN:518XX │         │
│  │ 10.10.0.0/24│  │ 10.20.0.0/24│  │ 10.XX.0.0/24│         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────┴────────────────┴────────────────┴──────┐         │
│  │              REST API (Go Backend)            │         │
│  │                   SQLite DB                   │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────┴────┐  ┌────┴────┐  ┌────┴────┐
         │ Client  │  │ Client  │  │ Client  │
         │ (Phone) │  │ (Laptop)│  │ (Server)│
         └─────────┘  └─────────┘  └─────────┘
```

### 1. Server (Backend)
📁 `./server`

The core logic written in **Go**.  
Manages WireGuard interfaces, SQLite database, and exposes the REST API.

- **Developer Guide:** `./server/DEVELOPER_GUIDE.md`  
- **User Guide:** `./server/USER_GUIDE.md`

---

### 2. Web Dashboard (Frontend)
📁 `./web`

Administrative interface built with **React**, **TypeScript**, and **Tailwind CSS**.

- **Developer Guide:** `./web/DEVELOPER_GUIDE.md`  
- **User Guide:** `./web/USER_GUIDE.md`

---

### 3. Installer
📁 `./installer`

A standalone **Node.js** tool that simplifies deployment on Linux servers via SSH.

- **Developer Guide:** `./installer/DEVELOPER_GUIDE.md`  
- **User Guide:** `./installer/USER_GUIDE.md`

---

> 🇦🇿 **Azərbaycan Dilində**  
> Layihənin əsas sənədlərini Azərbaycan dilində oxumaq üçün  
> 👉 **[README_AZ.md](./README_AZ.md)**

---

## ⚡ Quick Start

### Prerequisites

- Linux server (Ubuntu 20.04 / 22.04 recommended)
- Docker & Docker Compose installed locally (for installer)

---

### Installation via Installer (Recommended)

```bash
cd installer
docker-compose up -d --build
```

1. Open `http://localhost:3017`
2. Enter your remote server credentials
3. Click **Install NovusMesh Server**
4. After installation, connect to Admin VPN and access the Web Dashboard

**Dashboard URL:** `https://10.99.0.1:3007` (via VPN)  
**Login:** `admin`  
**Password:** Shown during installation

---

### Manual Installation

For advanced users, refer to the
👉 **[Server User Guide](./server/USER_GUIDE.md)**

---

## 🌐 Network Management

NovusMesh supports **multiple isolated networks**:

| Feature | Description |
|---------|-------------|
| **Isolated Subnets** | Each network has its own CIDR (e.g., 10.10.0.0/24, 10.20.0.0/24) |
| **Dedicated Interfaces** | Automatic WireGuard interface allocation (wg0, wg1, wg2...) |
| **Unique Ports** | Each network listens on a different UDP port (51820, 51821...) |
| **Independent Nodes** | Nodes belong to specific networks and are isolated from others |

### Creating a Network

1. Go to **Networks** page in the dashboard
2. Click **Create Network**
3. Enter a name and CIDR range (e.g., `10.50.0.0/24`)
4. The system automatically assigns interface and port

---

## 🛡️ Security Notes

* Installer generates **unique credentials** — save them immediately
* Ensure UDP ports **51820+** are open (one per network)
* Admin dashboard is **hidden behind VPN** by default
* For production use, run the Web Dashboard behind **Nginx or Caddy with SSL**

Security is not optional — it's the default.

---

## 📸 Screenshots

### Web Dashboard
<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="web/public/photo/web/0.png" alt="Web 0" width="45%">
  <img src="web/public/photo/web/1.png" alt="Web 1" width="45%">
  <img src="web/public/photo/web/2.png" alt="Web 2" width="45%">
  <img src="web/public/photo/web/3.png" alt="Web 3" width="45%">
  <img src="web/public/photo/web/4.png" alt="Web 4" width="45%">
  <img src="web/public/photo/web/5.png" alt="Web 5" width="45%">
  <img src="web/public/photo/web/6.png" alt="Web 6" width="45%">
</div>

### Installer Interface
<div style="display: flex; flex-wrap: wrap; gap: 10px;">
  <img src="web/public/photo/installer/0.png" alt="Installer 0" width="45%">
  <img src="web/public/photo/installer/1.png" alt="Installer 1" width="45%">
</div>

---

## 🤝 Contributing

Contributions are welcome ❤️
Bug reports, feature requests, and pull requests are highly appreciated.

Please read the **Developer Guides** before contributing.

---

## ⭐ Support the Project

If you find **NovusMesh** useful:

* ⭐ Star the repository
* 🐛 Open issues
* 💡 Suggest features
* 📣 Share it with others

Open-source lives through community.

---

**Developed by [Ali Zeynalli](https://github.com/Ali7Zeynalli)**
*Project NovusMesh*
