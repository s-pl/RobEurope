#!/usr/bin/env bash
set -euo pipefail

# ============================================
# RobEurope - Build & Setup Script
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

# ---------------------------
# 1. Check OS
# ---------------------------
if [[ "$(uname -s)" != "Linux" ]]; then
  err "This script only supports Linux."
fi
ok "Linux detected"

# ---------------------------
# 2. Check dependencies
# ---------------------------
check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    err "'$1' is not installed. Please install it and re-run this script."
  fi
}

check_cmd node
check_cmd npm
check_cmd docker

# Check node version >= 18
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if (( NODE_MAJOR < 18 )); then
  err "Node.js v18+ required (found v$(node -v))"
fi
ok "Node.js $(node -v)"

# Check docker compose (plugin or standalone)
if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  err "'docker compose' is not available. Install Docker Compose plugin."
fi
ok "$COMPOSE available"

# ---------------------------
# 3. Environment file
# ---------------------------
if [[ ! -f .env ]]; then
  if [[ -f .env.development ]]; then
    cp .env.development .env
    ok "Copied .env.development -> .env"
  else
    err "No .env or .env.development found"
  fi
else
  ok ".env already exists"
fi

# Load .env
set -a
source .env
set +a

# ---------------------------
# 3b. Generate frontend/.env if missing
# ---------------------------
if [[ ! -f frontend/.env ]]; then
  cat > frontend/.env <<EOF
VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:85}
VITE_WS_URL=${VITE_WS_URL:-ws://localhost:85}
VITE_APP_NAME=${VITE_APP_NAME:-RobEurope Dev}
EOF
  ok "Generated frontend/.env"
else
  ok "frontend/.env already exists"
fi

# ---------------------------
# 4. Install dependencies
# ---------------------------
log "Installing root dependencies..."
npm install

log "Installing backend dependencies..."
npm --prefix backend install

log "Installing frontend dependencies..."
npm --prefix frontend install

ok "All dependencies installed"

# ---------------------------
# 5. Determine if local MySQL is needed
# ---------------------------
DB_HOST="${DB_HOST_DEV:-localhost}"
NEED_LOCAL_DB=false

if [[ "$DB_HOST" == "localhost" || "$DB_HOST" == "127.0.0.1" || "$DB_HOST" == "mysql" ]]; then
  NEED_LOCAL_DB=true
fi

# ---------------------------
# 6. Start Docker containers
# ---------------------------
if [[ "$NEED_LOCAL_DB" == true ]]; then
  log "Local DB detected (DB_HOST_DEV=$DB_HOST) — starting MySQL + Redis..."
  $COMPOSE --profile local-db up -d
else
  log "External DB detected (DB_HOST_DEV=$DB_HOST) — starting Redis only..."
  $COMPOSE up -d
fi

ok "Docker containers started"

# ---------------------------
# 7. Wait for MySQL (if local)
# ---------------------------
if [[ "$NEED_LOCAL_DB" == true ]]; then
  log "Waiting for MySQL to be ready..."
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
# 8. Run migrations & seeders
# ---------------------------
log "Running database migrations..."
npm --prefix backend run migrate

log "Running database seeders..."
npm --prefix backend run seed

ok "Database setup complete"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  RobEurope build complete!${NC}"
echo -e "${GREEN}  Run ./start.sh to start the application${NC}"
echo -e "${GREEN}============================================${NC}"
