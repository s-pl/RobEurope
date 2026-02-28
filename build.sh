#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# RobEurope — Build Script
# Builds Docker images and runs initial DB migrations/seeds.
#
# Usage:
#   ./build.sh            # development (default)
#   ./build.sh prod       # production
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

PROFILE="${1:-dev}"

if [[ "$PROFILE" != "dev" && "$PROFILE" != "prod" ]]; then
  err "Unknown profile '$PROFILE'. Use 'dev' or 'prod'."
fi

# ---------------------------
# 1. Check dependencies
# ---------------------------
command -v docker &>/dev/null || err "Docker is not installed."

if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  err "'docker compose' plugin is not available."
fi
ok "Docker Compose: $COMPOSE"

# ---------------------------
# 2. Environment file
# ---------------------------
if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
    warn "Copied .env.example → .env. Edit it before continuing!"
  else
    err "No .env file found. Create one (see SETUP.md)."
  fi
else
  ok ".env found"
fi

# Load .env so $-variables are available in this script
set -a; source .env; set +a

# ---------------------------
# 3. Build images
# ---------------------------
log "Building Docker images (profile: $PROFILE)..."
$COMPOSE --profile "$PROFILE" build
ok "Images built"

# ---------------------------
# 4. Start infrastructure (MySQL + Redis)
# ---------------------------
log "Starting MySQL and Redis..."
$COMPOSE --profile "$PROFILE" up -d mysql redis

log "Waiting for MySQL to be healthy..."
RETRIES=40
until docker exec robeurope-mysql mysqladmin ping -h localhost --silent 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if (( RETRIES == 0 )); then
    err "MySQL did not become ready. Check: docker logs robeurope-mysql"
  fi
  sleep 3
done
ok "MySQL is ready"

# ---------------------------
# 5. Run migrations & seeds
# ---------------------------
log "Running database migrations..."
if [[ "$PROFILE" == "dev" ]]; then
  $COMPOSE --profile "$PROFILE" run --rm backend-dev sh -c "node scripts/run-migrations.js"
else
  $COMPOSE --profile "$PROFILE" run --rm backend     sh -c "node scripts/run-migrations.js"
fi
ok "Migrations applied"

log "Running database seeders..."
if [[ "$PROFILE" == "dev" ]]; then
  $COMPOSE --profile "$PROFILE" run --rm backend-dev sh -c "node scripts/run-seeders.js"
else
  $COMPOSE --profile "$PROFILE" run --rm backend     sh -c "node scripts/run-seeders.js"
fi
ok "Seeders applied"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  RobEurope build complete! (${PROFILE})${NC}"
echo -e "${GREEN}  Run ./start.sh [${PROFILE}] to launch${NC}"
echo -e "${GREEN}============================================${NC}"
