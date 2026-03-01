#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# RobEurope — PM2 setup for backend
# Keeps backend alive after SSH disconnect/reboot
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Priority:
# 1) first argument
# 2) /opt/robeurope (GitHub Actions deploy default)
# 3) script directory
if [[ -n "${1:-}" ]]; then
  ROOT_DIR="$1"
elif [[ -d "/opt/robeurope/backend" ]]; then
  ROOT_DIR="/opt/robeurope"
else
  ROOT_DIR="$SCRIPT_DIR"
fi

BACKEND_DIR="$ROOT_DIR/backend"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "[ERROR] backend directory not found at: $BACKEND_DIR"
  echo "[INFO] Usage: ./setup-pm2-backend.sh /ruta/al/proyecto"
  exit 1
fi

echo "[INFO] Using project path: $ROOT_DIR"

cd "$BACKEND_DIR"

echo "[INFO] Installing backend dependencies..."
npm install

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[INFO] PM2 not found globally. Installing PM2 globally..."
  npm install -g pm2
fi

mkdir -p logs

echo "[INFO] Starting backend with PM2..."
pm2 start ecosystem.config.cjs --env production

echo "[INFO] Saving PM2 process list..."
pm2 save

echo "[INFO] Configuring PM2 startup on boot (systemd)..."
if pm2 startup systemd -u "$USER" --hp "$HOME"; then
  echo "[OK] PM2 startup configured"
else
  echo "[WARN] Could not configure startup automatically."
  echo "[WARN] Run the command suggested by PM2 output above (usually with sudo)."
fi

echo ""
echo "[OK] Done. Useful commands:"
echo "  pm2 list"
echo "  pm2 logs robeurope-backend"
echo "  pm2 restart robeurope-backend"
echo "  pm2 stop robeurope-backend && pm2 delete robeurope-backend"
