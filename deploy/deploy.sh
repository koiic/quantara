#!/usr/bin/env bash
# ==============================================================================
# QUANTARA QUANT PLATFORM - AUTOMATED 1-CLICK PRODUCTION DEPLOYER
# Target OS: Ubuntu 22.04 / 24.04 LTS, Debian 12
# Recommended VPS: Hetzner Cloud CPX21 (€7.05/mo, 3 vCPUs AMD, 4 GB RAM)
# ==============================================================================

set -e

echo "=========================================================="
echo "  🚀 Starting Quantara Platform Production Deployment"
echo "=========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "[-] Please run as root (e.g. sudo bash deploy.sh)"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TARGET_DIR="/opt/quantara"

# 1. Install System Dependencies & Caddy Web Server
echo "[1/6] Updating APT & Installing System Prerequisites..."
apt-get update -y
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl git python3 python3-venv python3-pip

# Install Caddy
if ! command -v caddy &> /dev/null; then
    echo "[-] Installing Caddy reverse proxy..."
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg --yes
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -y
    apt-get install -y caddy
fi

# Install Node.js (v20 LTS) if not installed
if ! command -v node &> /dev/null; then
    echo "[-] Installing Node.js v20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 2. Deploy Project Files
echo "[2/6] Syncing application files to ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}"
if [ "${APP_ROOT}" != "${TARGET_DIR}" ]; then
    rsync -av --exclude 'node_modules' --exclude '.venv' --exclude '__pycache__' "${APP_ROOT}/" "${TARGET_DIR}/"
fi

# 3. Setup Python Backend Virtual Environment
echo "[3/6] Setting up Python Quantitative Environment..."
cd "${TARGET_DIR}/dpp/backend"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install uvicorn gymnasium streamlit
mkdir -p data ../datalake/raw ../datalake/processed

# 4. Compile React Frontend
echo "[4/6] Building Production React SPA Bundle..."
cd "${TARGET_DIR}/dpp/frontend"
npm install
npm run build

# 5. Install Systemd Services
echo "[5/6] Registering Systemd Units..."
cp "${TARGET_DIR}/dpp/deploy/systemd/quantara-backend.service" /etc/systemd/system/
cp "${TARGET_DIR}/dpp/deploy/systemd/quantara-yjs.service" /etc/systemd/system/
cp "${TARGET_DIR}/dpp/deploy/systemd/quantara-streamlit.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable quantara-backend quantara-yjs quantara-streamlit
systemctl restart quantara-backend quantara-yjs quantara-streamlit

# 6. Configure Reverse Proxy
echo "[6/6] Configuring Caddy Reverse Proxy..."
cp "${TARGET_DIR}/dpp/deploy/Caddyfile" /etc/caddy/Caddyfile
systemctl reload caddy || systemctl restart caddy

PUBLIC_IP=$(curl -s --max-time 3 ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo "=========================================================="
echo "  ✅ Quantara Quant Platform Deployed Successfully!"
echo "=========================================================="
echo "  Public IP Access:      http://${PUBLIC_IP}"
echo "  FastAPI Docs:          http://${PUBLIC_IP}/api/docs"
echo "  Executive Studio:      http://${PUBLIC_IP}/streamlit"
echo ""
echo "  Custom Domain Setup:"
echo "  1. Point an A record (e.g. quant.yourfirm.com) to ${PUBLIC_IP}"
echo "  2. Edit /etc/caddy/Caddyfile and replace 'quant.quantara.io' with your domain"
echo "  3. Run: systemctl reload caddy (Automatic HTTPS issued in 5s)"
echo "=========================================================="
