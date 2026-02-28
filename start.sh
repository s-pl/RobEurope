#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# RobEurope — Start Script
#
# Usage:
#   ./start.sh            # development (default)
#   ./start.sh prod       # production
#   ./start.sh stop       # stop all containers
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

ACTION="${1:-dev}"

# ---------------------------
# Detect Docker Compose
# ---------------------------
if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  err "'docker compose' is not available."
fi

# ---------------------------
# Stop action
# ---------------------------
if [[ "$ACTION" == "stop" ]]; then
  log "Stopping all RobEurope containers..."
  $COMPOSE --profile dev  down 2>/dev/null || true
  $COMPOSE --profile prod down 2>/dev/null || true
  ok "All containers stopped"
  exit 0
fi

PROFILE="$ACTION"
if [[ "$PROFILE" != "dev" && "$PROFILE" != "prod" ]]; then
  err "Unknown action '$PROFILE'. Use 'dev', 'prod', or 'stop'."
fi

# ---------------------------
# Load .env
# ---------------------------
[[ -f .env ]] || err "No .env file. Run ./build.sh first."
set -a; source .env; set +a

# ---------------------------
# Start
# ---------------------------
log "Starting RobEurope ($PROFILE)..."
$COMPOSE --profile "$PROFILE" up -d

ok "All containers started"

if [[ "$PROFILE" == "dev" ]]; then
  echo ""
  echo -e "${GREEN}============================================${NC}"
  echo -e "${GREEN}  RobEurope DEV is running!${NC}"
  echo -e "${GREEN}  Backend:  http://localhost:${PORT:-85}${NC}"
  echo -e "${GREEN}  Frontend: http://localhost:5173${NC}"
  echo -e "${GREEN}  MySQL:    localhost:${MYSQL_HOST_PORT:-3306}${NC}"
  echo -e "${GREEN}  Redis:    localhost:${REDIS_HOST_PORT:-6379}${NC}"
  echo -e "${GREEN}============================================${NC}"
  echo -e "  Logs: docker compose --profile dev logs -f"
  echo -e "  Stop: ./start.sh stop"
else
  echo ""
  echo -e "${GREEN}============================================${NC}"
  echo -e "${GREEN}  RobEurope PROD is running!${NC}"
  echo -e "${GREEN}  Backend:  http://localhost:${PORT:-85}${NC}"
  echo -e "${GREEN}  Frontend: http://localhost:3000${NC}"
  echo -e "${GREEN}============================================${NC}"
  echo -e "  Logs: docker compose --profile prod logs -f"
  echo -e "  Stop: ./start.sh stop"
fi
