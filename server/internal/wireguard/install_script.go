package wireguard

// JoinScriptTemplate is the bash script to join a server to the VPN
const JoinScriptTemplate = `#!/bin/bash
set -e

# Configuration
PRIVATE_KEY="{{.PrivateKey}}"
ADDRESS="{{.Address}}"
LISTEN_PORT={{.ListenPort}}
SERVER_PUBLIC_KEY="{{.ServerPublicKey}}"
SERVER_ENDPOINT="{{.ServerEndpoint}}"
ALLOWED_IPS="{{.AllowedIPs}}"

echo "Setting up WireGuard..."

# Install WireGuard if missing
if ! command -v wg &> /dev/null; then
    apt-get update && apt-get install -y wireguard wireguard-tools
fi

# Enable IP Forwarding
echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-wireguard.conf
sysctl -p /etc/sysctl.d/99-wireguard.conf

# Create Config
cat <<EOF > /etc/wireguard/wg0.conf
[Interface]
PrivateKey = $PRIVATE_KEY
Address = $ADDRESS
# ListenPort = $LISTEN_PORT # Client usually random

[Peer]
PublicKey = $SERVER_PUBLIC_KEY
Endpoint = $SERVER_ENDPOINT
AllowedIPs = $ALLOWED_IPS
PersistentKeepalive = 25
EOF

# Start service
systemctl enable wg-quick@wg0
systemctl restart wg-quick@wg0

echo "WireGuard joined successfully!"
`
