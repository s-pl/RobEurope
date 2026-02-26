#!/usr/bin/env bash
set -euo pipefail

# ============================================
# RobEurope - Start Script
# ============================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

PIDS=()

cleanup() {
  echo ""
  log "Shutting down..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  ok "All processes stopped"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ---------------------------
# 1. Load .env
# ---------------------------
if [[ ! -f .env ]]; then
  err "No .env file found. Run ./build.sh first."
fi

set -a
source .env
set +a

# ---------------------------
# 2. Detect Docker Compose
# ---------------------------
if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  err "'docker compose' is not available."
fi

# ---------------------------
# 3. Determine if local MySQL is needed
# ---------------------------
DB_HOST="${DB_HOST_DEV:-localhost}"
NEED_LOCAL_DB=false

if [[ "$DB_HOST" == "localhost" || "$DB_HOST" == "127.0.0.1" || "$DB_HOST" == "mysql" ]]; then
  NEED_LOCAL_DB=true
fi

# ---------------------------
# 4. Start Docker containers
# ---------------------------
if [[ "$NEED_LOCAL_DB" == true ]]; then
  log "Starting MySQL + Redis..."
  $COMPOSE --profile local-db up -d
else
  log "Starting Redis only..."
  $COMPOSE up -d
fi

ok "Docker containers running"

# ---------------------------
# 5. Wait for MySQL (if local)
# ---------------------------
if [[ "$NEED_LOCAL_DB" == true ]]; then
  log "Waiting for MySQL..."
  RETRIES=30
  until docker exec robeurope-mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if (( RETRIES == 0 )); then
      err "MySQL did not become ready in time"
    fi
    sleep 2
  done
  ok "MySQL is ready"
fi

# ---------------------------
# 6. Start backend & frontend
# ---------------------------
log "Starting backend..."
npm --prefix backend run dev &
PIDS+=($!)

log "Starting frontend..."
npm --prefix frontend run dev &
PIDS+=($!)

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  RobEurope is running!${NC}"
echo -e "${GREEN}  Backend:  http://localhost:${PORT:-85}${NC}"
echo -e "${GREEN}  Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}  Press Ctrl+C to stop${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

wait
