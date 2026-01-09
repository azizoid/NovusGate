# NovusMesh Server - User Guide

## Introduction
The **NovusMesh Server** is the backbone of your VPN network. It runs quietly in the background, maintaining the secure encrypted tunnels between your devices.

## Installation
*Note: We highly recommend using the **NovusMesh Installer** for automatic deployment.*

### Docker Deployment (Manual)
If you prefer to run it manually using Docker:

1. **Create `docker-compose.yml`:**
   ```yaml
   version: "3"
   services:
     control-plane:
       image: novusmesh/server:latest
       cap_add: [NET_ADMIN]
       network_mode: host
       volumes:
         - ./data:/app/data
       env_file: .env
   ```

2. **Create `.env` Configuration:**
   ```bash
   # Security
   JWT_SECRET=super_secure_random_string
   API_KEY=another_secure_string_for_internal_use
   DB_PASSWORD=database_encryption_key
   
   # Network
   WG_SERVER_ENDPOINT=YOUR_PUBLIC_IP
   ```

3. **Start:**
   ```bash
   docker-compose up -d
   ```

## Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for signing API tokens. **Critical Security.** | Required |
| `API_KEY` | Key for inter-service communication. | Required |
| `DB_PASSWORD` | Encryption key for the SQLite database. | Required |
| `WG_SERVER_ENDPOINT` | The Public IP or Domain where clients connect. | Auto-detect |
| `PORT` | API listening port. | 8080 |

### Data Storage
- All server state is stored in `data/novusmesh.db`.
- **Backup:** Regularly back up the `data/` folder to safe locations.
- **Loss:** Losing this file means losing all peer configurations and keys.

## Troubleshooting

### "Clients cannot connect"
- Check if port **51820 UDP** is open on your firewall/router.
- Verify `WG_SERVER_ENDPOINT` in `.env` matches your actual Public IP.

### "Server restarts loop"
- Check logs: `docker logs novusmesh-server`.
- Common issue: `database is locked` or permissions error on `data/` folder.

### "API 500 Error"
- Ensure `JWT_SECRET` is set and matches what the Web Dashboard expects.

## Support
Developed by [Ali Zeynalli](https://github.com/Ali7Zeynalli).
