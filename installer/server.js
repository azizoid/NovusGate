const express = require('express');
const { Client } = require('ssh2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Project paths
const PROJECT_ROOT = path.join(__dirname, '..', 'server');
const DATA_DIR = path.join(__dirname, 'data');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize servers.json if not exists
if (!fs.existsSync(SERVERS_FILE)) {
  fs.writeFileSync(SERVERS_FILE, JSON.stringify({ servers: [] }, null, 2));
}

// Load/Save servers
function loadServers() {
  try {
    return JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf8'));
  } catch {
    return { servers: [] };
  }
}

function saveServers(data) {
  fs.writeFileSync(SERVERS_FILE, JSON.stringify(data, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// SSH Connection helper
function createSSHConnection(server) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    
    conn.on('ready', () => resolve(conn));
    conn.on('error', reject);
    
    const config = {
      host: server.host,
      port: server.port || 22,
      username: server.username,
      readyTimeout: 30000
    };
    
    if (server.privateKey) {
      config.privateKey = server.privateKey;
    } else if (server.password) {
      config.password = server.password;
    }
    
    conn.connect(config);
  });
}

// Execute SSH command
function execSSH(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);
      
      let stdout = '';
      let stderr = '';
      
      stream.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });
      stream.on('data', (data) => { stdout += data.toString(); });
      stream.stderr.on('data', (data) => { stderr += data.toString(); });
    });
  });
}

// ============ API ENDPOINTS ============

// GET /api/servers - List all servers
app.get('/api/servers', (req, res) => {
  const data = loadServers();
  // Don't send passwords
  const servers = data.servers.map(s => ({
    id: s.id,
    name: s.name,
    host: s.host,
    port: s.port,
    username: s.username,
    status: s.status,
    lastCheck: s.lastCheck,
    installedAt: s.installedAt,
    history: s.history
  }));
  res.json(servers);
});

// POST /api/servers - Add new server
app.post('/api/servers', (req, res) => {
  const { name, host, port, username, password, privateKey } = req.body;
  
  if (!name || !host || !username) {
    return res.status(400).json({ error: 'Name, host, and username are required' });
  }
  
  const data = loadServers();
  const server = {
    id: generateId(),
    name,
    host,
    port: port || 22,
    username,
    password,
    privateKey,
    status: 'unknown',
    lastCheck: null,
    installedAt: null,
    history: []
  };
  
  data.servers.push(server);
  saveServers(data);
  
  res.json({ id: server.id, message: 'Server added' });
});

// DELETE /api/servers/:id
app.delete('/api/servers/:id', (req, res) => {
  const data = loadServers();
  data.servers = data.servers.filter(s => s.id !== req.params.id);
  saveServers(data);
  res.json({ message: 'Server deleted' });
});

// GET /api/servers/:id/status - Check server status
app.get('/api/servers/:id/status', async (req, res) => {
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    
    // Check novusmesh installation
    const novusmeshCheck = await execSSH(conn, 'test -d /opt/novusmesh && echo "installed" || echo "not_installed"');
    const isInstalled = novusmeshCheck.stdout.trim() === 'installed';
    
    // Check Docker containers
    const dockerPs = await execSSH(conn, 'docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>/dev/null | grep novusmesh || true');
    const containers = dockerPs.stdout.trim().split('\n').filter(Boolean).map(line => {
      const [name, status, ports] = line.split('|');
      return { name, status, ports };
    });
    
    // Check disk space
    const diskCheck = await execSSH(conn, 'df -h / | tail -1 | awk \'{print $4}\'');
    const freeSpace = diskCheck.stdout.trim();
    
    // Check memory
    const memCheck = await execSSH(conn, 'free -h | grep Mem | awk \'{print $4}\'');
    const freeMemory = memCheck.stdout.trim();
    
    conn.end();
    
    // Update server status
    server.status = isInstalled ? 'installed' : 'not_installed';
    server.lastCheck = new Date().toISOString();
    saveServers(data);
    
    res.json({
      id: server.id,
      name: server.name,
      host: server.host,
      status: server.status,
      isInstalled,
      containers,
      freeSpace,
      freeMemory,
      lastCheck: server.lastCheck
    });
    
  } catch (err) {
    server.status = 'offline';
    server.lastCheck = new Date().toISOString();
    saveServers(data);
    
    res.status(500).json({ error: 'Unable to connect to server: ' + err.message });
  }
});

// GET /api/servers/:id/docker - Get Docker containers
app.get('/api/servers/:id/docker', async (req, res) => {
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    
    const result = await execSSH(conn, `
      docker ps -a --format '{"name":"{{.Names}}","status":"{{.Status}}","image":"{{.Image}}","ports":"{{.Ports}}"}' 2>/dev/null || echo "[]"
    `);
    
    conn.end();
    
    const containers = result.stdout.trim().split('\n').filter(Boolean).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    res.json(containers);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/docker/:action - Control Docker container
app.post('/api/servers/:id/docker/:action', async (req, res) => {
  const { container } = req.body;
  const action = req.params.action; // start, stop, restart, remove
  
  if (!['start', 'stop', 'restart', 'remove', 'logs'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    
    let command;
    if (action === 'logs') {
      command = `docker logs --tail 100 ${container}`;
    } else if (action === 'remove') {
      command = `docker rm -f ${container}`;
    } else {
      command = `docker ${action} ${container}`;
    }
    
    const result = await execSSH(conn, command);
    conn.end();
    
    // Add to history
    server.history = server.history || [];
    server.history.unshift({
      action: `docker_${action}`,
      container,
      timestamp: new Date().toISOString(),
      success: result.code === 0
    });
    server.history = server.history.slice(0, 50); // Keep last 50
    saveServers(data);
    
    if (action === 'logs') {
      res.json({ logs: result.stdout + result.stderr });
    } else {
      res.json({ 
        success: result.code === 0, 
        output: result.stdout + result.stderr 
      });
    }
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/servers/:id/images - Get Docker images
app.get('/api/servers/:id/images', async (req, res) => {
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    // Include ID for dangling images that have no repository/tag
    const result = await execSSH(conn, `docker images --format '{"id":"{{.ID}}","repository":"{{.Repository}}","tag":"{{.Tag}}","size":"{{.Size}}","created":"{{.CreatedSince}}"}' 2>/dev/null`);
    conn.end();
    
    const images = result.stdout.trim().split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
    
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/prune - Prune unused Docker resources
app.post('/api/servers/:id/prune', async (req, res) => {
  const { type = 'all' } = req.body; // images, containers, volumes, all
  
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    
    let command;
    switch (type) {
      case 'images':
        command = 'docker image prune -af';
        break;
      case 'containers':
        command = 'docker container prune -f';
        break;
      case 'volumes':
        command = 'docker volume prune -f';
        break;
      default:
        command = 'docker system prune -af --volumes';
    }
    
    const result = await execSSH(conn, command);
    conn.end();
    
    server.history = server.history || [];
    server.history.unshift({
      action: `prune_${type}`,
      timestamp: new Date().toISOString(),
      success: result.code === 0
    });
    saveServers(data);
    
    res.json({ success: result.code === 0, output: result.stdout + result.stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/servers/:id/images/:name - Delete Docker image
app.delete('/api/servers/:id/images/:name', async (req, res) => {
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    const result = await execSSH(conn, `docker rmi -f ${decodeURIComponent(req.params.name)}`);
    conn.end();
    
    res.json({ success: result.code === 0, output: result.stdout + result.stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/servers/:id/volumes - Get Docker volumes
app.get('/api/servers/:id/volumes', async (req, res) => {
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    const result = await execSSH(conn, `docker volume ls --format '{"name":"{{.Name}}","driver":"{{.Driver}}"}' 2>/dev/null`);
    conn.end();
    
    const volumes = result.stdout.trim().split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
    
    res.json(volumes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/servers/:id/volumes/:name - Delete Docker volume
app.delete('/api/servers/:id/volumes/:name', async (req, res) => {
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    const result = await execSSH(conn, `docker volume rm -f ${req.params.name}`);
    conn.end();
    
    res.json({ success: result.code === 0, output: result.stdout + result.stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/uninstall - Clean uninstall novusmesh
app.post('/api/servers/:id/uninstall', async (req, res) => {
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  const UNINSTALL_SCRIPT = `
#!/bin/bash
echo "=========================================="
echo "  NovusMesh UNINSTALLING"
echo "=========================================="

cd /opt/novusmesh 2>/dev/null || true

# Stop containers
if [ -f "deployments/docker/docker-compose.yml" ]; then
  docker-compose -f deployments/docker/docker-compose.yml down -v --rmi local 2>/dev/null || true
fi

# Stop any novusmesh containers
docker ps -a | grep novusmesh | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

# Remove images
docker images | grep novusmesh | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# Remove volumes
docker volume ls | grep novusmesh | awk '{print $2}' | xargs -r docker volume rm -f 2>/dev/null || true

# Remove files
rm -rf /opt/novusmesh

echo ""
echo "NovusMesh completely removed!"
`;

  try {
    const conn = await createSSHConnection(server);
    const result = await execSSH(conn, UNINSTALL_SCRIPT);
    conn.end();
    
    server.status = 'not_installed';
    server.history = server.history || [];
    server.history.unshift({
      action: 'uninstall',
      timestamp: new Date().toISOString(),
      success: result.code === 0
    });
    saveServers(data);
    
    res.json({ success: result.code === 0, output: result.stdout + result.stderr });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/install - Install novusmesh
app.post('/api/servers/:id/install', async (req, res) => {
  const { source = 'local', reinstall = false, update = false, migrateOnly = false } = req.body;
  
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  let archivePath = null;
  
  // Create archive for local mode
  if (source === 'local') {
    try {
      archivePath = await createProjectArchive();
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create archive: ' + err.message });
    }
  }
  
  try {
    const conn = await createSSHConnection(server);
    
    // Upload archive if local mode
    if (source === 'local' && archivePath) {
      await uploadFile(conn, archivePath, '/tmp/novusmesh.tar.gz');
      fs.unlinkSync(archivePath);
    }
    
    // Select install script
    let script = INSTALL_SCRIPT_LOCAL;
    if (migrateOnly) {
      script = DATABASE_MIGRATE_SCRIPT;
    } else if (update) {
      script = UPDATE_SCRIPT;
    } else if (reinstall) {
      script = REINSTALL_SCRIPT;
    }
    
    // Use streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    
    let output = '';
    
    conn.exec(script, (err, stream) => {
      if (err) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
        conn.end();
        return;
      }
      
      stream.on('data', (chunk) => {
        const text = chunk.toString();
        output += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      });
      
      stream.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        output += text;
        res.write(`data: ${JSON.stringify({ text, stderr: true })}\n\n`);
      });
      
      stream.on('close', (code) => {
        conn.end();
        
        // Update server
        server.status = code === 0 ? 'installed' : 'error';
        server.installedAt = new Date().toISOString();
        server.history = server.history || [];
        server.history.unshift({
          action: update ? 'update' : (reinstall ? 'reinstall' : 'install'),
          source,
          timestamp: new Date().toISOString(),
          success: code === 0
        });
        saveServers(data);
        
        if (code === 0) {
          // Parse API Key and Update local web/.env
          try {
            const apiKeyMatch = output.match(/API_KEY:\s+([a-zA-Z0-9]+)/);
            if (apiKeyMatch && apiKeyMatch[1]) {
              const apiKey = apiKeyMatch[1];
              const apiHost = server.host; // Use SSH host
              const envContent = `API_URL=http://${apiHost}:8080\nAPI_KEY=${apiKey}\n`;
              
              // Try Docker mount path first, then local path
              const dockerPath = '/web/.env';
              const localPath = path.join(__dirname, '..', 'web', '.env');
              const envPath = fs.existsSync('/web') ? dockerPath : localPath;
              
              fs.writeFileSync(envPath, envContent);
              
              res.write(`data: ${JSON.stringify({ text: '\n[INFO] Local web/.env file updated! 🚀\n' })}\n\n`);
            }
          } catch (e) {
            console.error('Error updating web/.env:', e);
            res.write(`data: ${JSON.stringify({ text: `\n[WARN] Failed to update web/.env: ${e.message}\n` })}\n\n`);
          }
        }

        res.write(`data: ${JSON.stringify({ done: true, success: code === 0 })}\n\n`);
        res.end();
      });
    });
    
  } catch (err) {
    if (archivePath && fs.existsSync(archivePath)) {
      fs.unlinkSync(archivePath);
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/command - Run custom command
app.post('/api/servers/:id/command', async (req, res) => {
  const { command } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  try {
    const conn = await createSSHConnection(server);
    const result = await execSSH(conn, command);
    conn.end();
    
    res.json({
      success: result.code === 0,
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/servers/:id/join-vpn - Join server to VPN
app.post('/api/servers/:id/join-vpn', async (req, res) => {
  const { networkId, controlPlaneUrl, apiKey } = req.body;
  
  if (!networkId || !controlPlaneUrl || !apiKey) {
    return res.status(400).json({ error: 'NetworkId, ControlPlaneUrl and ApiKey are required' });
  }

  const data = loadServers();
  const server = data.servers.find(s => s.id === req.params.id);
  
  if (!server) {
    return res.status(404).json({ error: 'Server tapılmadı' });
  }

  try {
    const conn = await createSSHConnection(server);
    
    // 1. Install WireGuard
    await execSSH(conn, 'apt-get update && apt-get install -y wireguard curl');
    
    // 2. Generate Keys
    const privKeyResult = await execSSH(conn, 'wg genkey');
    const privateKey = privKeyResult.stdout.trim();
    const pubKeyResult = await execSSH(conn, `echo "${privateKey}" | wg pubkey`);
    const publicKey = pubKeyResult.stdout.trim();
    
    // 3. Register with Control Plane
    // We need to make an HTTP request from the Installer Service to the Control Plane
    // Or we can do it via curl from the target server? 
    // Let's do it from the Installer Service using fetch/axios (need to install axios or use fetch if node 18+)
    // But easier via curl on target to avoid connectivity issues from Installer -> CP
    
    // Construct curl command to register and get config
    // POST /api/v1/networks/{networkId}/servers
    const registerCmd = `curl -s -X POST "${controlPlaneUrl}/api/v1/networks/${networkId}/servers" \
      -H "X-API-Key: ${apiKey}" \
      -H "Content-Type: application/json" \
      -d '{"name":"${server.name}","publicKey":"${publicKey}","labels":{"installer":"true"}}'`;
      
    const registerResult = await execSSH(conn, registerCmd);
    if (registerResult.code !== 0) {
      throw new Error(`Registration failed: ${registerResult.stderr}`);
    }
    
    const response = JSON.parse(registerResult.stdout);
    if (!response.config) {
        // Access config via dedicated endpoint if not returned directly (our API returns full object?)
        // Our config_handlers.go createServerWithConfig returns: { node: ..., config: ... }
        throw new Error('No config received from Control Plane');
    }
    
    const wgConfig = response.config;
    
    // 4. Write Config
    await execSSH(conn, `echo "${wgConfig}" > /etc/wireguard/wg0.conf`);
    
    // 5. Enable IP Forwarding
    await execSSH(conn, 'sysctl -w net.ipv4.ip_forward=1');
    await execSSH(conn, 'echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-wireguard.conf');
    
    // 6. Start WireGuard
    await execSSH(conn, 'systemctl enable --now wg-quick@wg0');
    
    conn.end();
    
    server.history = server.history || [];
    server.history.unshift({
      action: 'join-vpn',
      timestamp: new Date().toISOString(),
      success: true
    });
    saveServers(data);
    
    res.json({ success: true, message: 'Successfully joined VPN!' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ INSTALL SCRIPTS ============

const INSTALL_SCRIPT_LOCAL = `
#!/bin/bash
set -e

INSTALL_DIR="/opt/novusmesh"
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

log_info() { echo -e "\${GREEN}[INFO]\${NC} $1"; }
log_warn() { echo -e "\${YELLOW}[WARN]\${NC} $1"; }
log_error() { echo -e "\${RED}[ERROR]\${NC} $1"; }

echo "=========================================="
echo "  NovusMesh Server Installer"
echo "=========================================="

# Update system
log_info "Updating system..."
apt-get update -qq

# Install Docker if not present
if ! command -v docker &> /dev/null; then
  log_info "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
else
  log_info "Docker already installed ✓"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
  log_info "Installing Docker Compose..."
  apt-get install -y docker-compose
else
  log_info "Docker Compose already installed ✓"
fi

# Extract archive
log_info "Extracting archive..."
mkdir -p "$INSTALL_DIR"
tar -xzf /tmp/novusmesh.tar.gz -C "$INSTALL_DIR"
rm -f /tmp/novusmesh.tar.gz

# Generate secrets
log_info "Generating security keys..."
generate_secret() {
  openssl rand -hex 16 2>/dev/null || head -c 16 /dev/urandom | od -An -t x1 | tr -d ' \n'
}

API_KEY=$(generate_secret)
JWT_SECRET=$(generate_secret)
TURN_SECRET=$(generate_secret)
DB_PASSWORD=$(generate_secret)
ADMIN_PASSWORD=$(generate_secret)
ADMIN_USERNAME="admin"

# Detect Server Public IP
log_info "Detecting Server IP..."
SERVER_IP=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s -4 icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}')
log_info "Server IP: $SERVER_IP"

# Create Server .env
cat <<EOF > "$INSTALL_DIR/deployments/docker/.env"
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
TURN_SECRET=$TURN_SECRET
API_KEY=$API_KEY
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD
WG_SERVER_ENDPOINT=$SERVER_IP
EOF


# Start services
log_info "Starting services..."
cd "$INSTALL_DIR"
docker-compose -f deployments/docker/docker-compose.yml up -d --build

# Wait
log_info "Waiting 30 seconds..."
sleep 30

# Initialize
log_info "Creating network..."
# We run init to create the default network and admin user
INIT_OUTPUT=$(docker-compose -f deployments/docker/docker-compose.yml exec -T control-plane ./novusmesh-server init --name "default-network" --cidr "10.10.0.0/16" 2>&1 || true)
echo "$INIT_OUTPUT"

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo -e "\${GREEN}  INSTALLATION COMPLETE!\${NC}"
echo "=========================================="
echo "Server IP: $SERVER_IP"
echo "Admin Dashboard: http://$SERVER_IP:8080"
echo ""
echo "------------------------------------------"
echo "  SECURITY KEYS (SAVE THESE!)"
echo "------------------------------------------"
echo "ADMIN USER:  $ADMIN_USERNAME"
echo "ADMIN PASS:  $ADMIN_PASSWORD"
echo "------------------------------------------"
echo "API_KEY:     $API_KEY"
echo "------------------------------------------"
echo "INTERNAL SECRETS (.env):"
echo "DB_PASSWORD: $DB_PASSWORD"
echo "JWT_SECRET:  $JWT_SECRET"
echo "TURN_SECRET: $TURN_SECRET"
echo "------------------------------------------"
echo "These keys were automatically written to deployments/docker/.env"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep novusmesh || true
`;


const REINSTALL_SCRIPT = `
#!/bin/bash
set -e

INSTALL_DIR="/opt/novusmesh"

echo "=========================================="
echo "  NovusMesh REINSTALL"
echo "=========================================="

# Backup .env before deleting
if [ -f "$INSTALL_DIR/deployments/docker/.env" ]; then
  echo "Preserving old config..."
  cp "$INSTALL_DIR/deployments/docker/.env" /tmp/novusmesh.env.bak
fi

# Stop and remove existing
if [ -f "$INSTALL_DIR/deployments/docker/docker-compose.yml" ]; then
  cd "$INSTALL_DIR"
  # NO -v flag here, keep volumes!
  docker-compose -f deployments/docker/docker-compose.yml down --rmi local 2>/dev/null || true
fi

# Remove files but KEEP the data directory
if [ -d "$INSTALL_DIR" ]; then
  echo "Cleaning files (preserving data)..."
  find "$INSTALL_DIR" -maxdepth 1 ! -name 'data' ! -name '.' -exec rm -rf {} +
fi

# Extract new
mkdir -p "$INSTALL_DIR"
tar -xzf /tmp/novusmesh.tar.gz -C "$INSTALL_DIR"
rm -f /tmp/novusmesh.tar.gz

# Note: In reinstall, we might want to keep old secrets or generate new ones?
# Usually reinstall means "nuclear option", so let's check if .env exists, if so keep it, else generate
cd "$INSTALL_DIR"

# Restore or generate .env
if [ -f "/tmp/novusmesh.env.bak" ]; then
  echo "Restoring configuration..."
  mv /tmp/novusmesh.env.bak deployments/docker/.env
  
  # Add WG_SERVER_ENDPOINT if missing
  if ! grep -q "WG_SERVER_ENDPOINT" deployments/docker/.env; then
    SERVER_IP=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s -4 icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}')
    echo "WG_SERVER_ENDPOINT=$SERVER_IP" >> deployments/docker/.env
    echo "WG_SERVER_ENDPOINT added: $SERVER_IP"
  fi
else
  echo "Generating new keys..."
  generate_secret() { openssl rand -hex 16 2>/dev/null || head -c 16 /dev/urandom | od -An -t x1 | tr -d ' \\n'; }
  
  API_KEY=$(generate_secret)
  JWT_SECRET=$(generate_secret)
  TURN_SECRET=$(generate_secret)
  DB_PASSWORD=$(generate_secret)
  ADMIN_PASSWORD=$(generate_secret)
  ADMIN_USERNAME="admin"
  SERVER_IP=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s -4 icanhazip.com 2>/dev/null || hostname -I | awk '{print $1}')
  
  cat <<EOF > deployments/docker/.env
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
TURN_SECRET=$TURN_SECRET
API_KEY=$API_KEY
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD
WG_SERVER_ENDPOINT=$SERVER_IP
EOF
fi

# Start
docker-compose -f deployments/docker/docker-compose.yml up -d --build


sleep 30
# Only init usually if db was wiped. Since we did 'down -v', db is wiped.
docker-compose -f deployments/docker/docker-compose.yml exec -T control-plane ./novusmesh-server init --name "default-network" --cidr "10.10.0.0/16" 2>&1 || true

echo "REINSTALL CONFIRMED!"
docker ps | grep novusmesh || true
`;

// ============ HELPERS ============

const UPDATE_SCRIPT = `
#!/bin/bash
set -e
INSTALL_DIR="/opt/novusmesh"
TEMP_DIR="/tmp/novusmesh_update"

echo "=========================================="
echo "  NovusMesh SMART UPDATE"
echo "  .env and data/ PRESERVED"
echo "=========================================="

# 1. Extract new code to temp dir
echo "[1/4] Extracting new files..."
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
tar -xzf /tmp/novusmesh.tar.gz -C "$TEMP_DIR"
rm -f /tmp/novusmesh.tar.gz

# 2. Copy only changed files with rsync (excluding env and data)
echo "[2/4] Comparing and updating files..."
if command -v rsync &> /dev/null; then
  rsync -av --delete \\
    --exclude='.env' \\
    --exclude='deployments/docker/.env' \\
    --exclude='data/' \\
    --exclude='*.log' \\
    "$TEMP_DIR/" "$INSTALL_DIR/"
else
  # If rsync is missing, use cp
  echo "rsync not found, using cp..."
  # Backup .env
  if [ -f "$INSTALL_DIR/deployments/docker/.env" ]; then
    cp "$INSTALL_DIR/deployments/docker/.env" /tmp/novusmesh.env.bak
  fi
  
  # Copy all except data
  find "$TEMP_DIR" -mindepth 1 -maxdepth 1 ! -name 'data' -exec cp -r {} "$INSTALL_DIR/" \\;
  
  # Restore .env
  if [ -f "/tmp/novusmesh.env.bak" ]; then
    mv /tmp/novusmesh.env.bak "$INSTALL_DIR/deployments/docker/.env"
  fi
fi

# 3. Clean temp
rm -rf "$TEMP_DIR"

# 4. Rebuild Docker containers
echo "[3/4] Rebuilding Docker containers..."
cd "$INSTALL_DIR"

# Clean old containers and images to prevent errors
docker-compose -f deployments/docker/docker-compose.yml down --rmi local 2>/dev/null || true

# Start again
docker-compose -f deployments/docker/docker-compose.yml up -d --build --remove-orphans

# 5. Run migration (new columns may exist)
echo "[4/4] Running database migrations..."
sleep 5
docker-compose -f deployments/docker/docker-compose.yml exec -T control-plane ./novusmesh-server migrate 2>&1 || echo "Migration skipped or not needed"

echo ""
echo "=========================================="
echo "  UPDATE COMPLETE!"
echo "  ✅ Files updated"  
echo "  ✅ .env preserved"
echo "  ✅ Database preserved"
echo "=========================================="
docker ps --format "table {{.Names}}\\t{{.Status}}" | grep novusmesh || true
`;

// Database-only migration script (no file changes)
const DATABASE_MIGRATE_SCRIPT = `
#!/bin/bash
set -e
INSTALL_DIR="/opt/novusmesh"

echo "=========================================="
echo "  NovusMesh DATABASE MIGRATION"
echo "  Files PRESERVED"
echo "=========================================="

cd "$INSTALL_DIR"

echo "[1/2] Checking database migrations..."
docker-compose -f deployments/docker/docker-compose.yml exec -T control-plane ./novusmesh-server migrate

echo ""
echo "=========================================="
echo "  ✅ Database updated!"
echo "=========================================="
`;
function createProjectArchive() {
  return new Promise((resolve, reject) => {
    const archivePath = path.join(__dirname, 'novusmesh.tar.gz');
    
    const excludes = [
      '--exclude=node_modules',
      '--exclude=.git',
      '--exclude=*.exe',
      '--exclude=*.tar.gz',
      '--exclude=*.log',
      '--exclude=.env',
      '--exclude=.idea',
      '--exclude=.vscode',
      '--exclude=server/start_dev.sh', // Exclude dev scripts
      '--exclude=installer/node_modules' // Exclude installer modules from archive
    ].join(' ');
    
    const tarCommand = `tar -czf "${archivePath}" -C "${PROJECT_ROOT}" ${excludes} .`;
    
    exec(tarCommand, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(archivePath);
      }
    });
  });
}

function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      
      const readStream = fs.createReadStream(localPath);
      const writeStream = sftp.createWriteStream(remotePath);
      
      writeStream.on('close', resolve);
      writeStream.on('error', reject);
      readStream.pipe(writeStream);
    });
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0' });
});

// Start server
const PORT = process.env.PORT || 3017;
app.listen(PORT, () => {
  console.log(`novusmesh Server Manager: http://localhost:${PORT}`);
  console.log(`Server data: ${SERVERS_FILE}`);
});
