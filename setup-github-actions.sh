#!/usr/bin/env bash
# ============================================================
# RobEurope — GitHub Actions Deploy Setup
#
# Ejecutar en el SERVIDOR como root (o con sudo).
# Prepara el usuario deploy, clona el repo y genera la clave
# SSH que debes añadir como secret en GitHub.
#
# Uso:
#   sudo ./setup-github-actions.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
log()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[ OK ]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERR ]${NC} $*"; exit 1; }
step() { echo -e "\n${CYAN}══════ $* ══════${NC}"; }

[[ "$EUID" -ne 0 ]] && err "Ejecuta como root o con sudo."

# ── Configuración ────────────────────────────────────────────
DEPLOY_USER="deploy"
DEPLOY_PATH="/opt/robeurope"
REPO_URL="https://github.com/s-pl/RobEurope.git"
REPO_BRANCH="main"
SSH_KEY_PATH="/home/${DEPLOY_USER}/.ssh/github_actions_deploy"

# ============================================================
# PASO 1 — Usuario deploy
# ============================================================
step "Usuario deploy"

if id "$DEPLOY_USER" &>/dev/null; then
  ok "Usuario '$DEPLOY_USER' ya existe"
else
  log "Creando usuario '$DEPLOY_USER' (sin login interactivo)..."
  useradd --system --create-home --shell /bin/bash "$DEPLOY_USER"
  ok "Usuario '$DEPLOY_USER' creado"
fi

# Añadir al grupo docker (crearlo si no existe pero docker sí está instalado)
if ! getent group docker &>/dev/null; then
  if command -v docker &>/dev/null; then
    log "Grupo 'docker' no existe, creándolo..."
    groupadd docker
    ok "Grupo 'docker' creado"
  else
    warn "Docker no está instalado. Instálalo y vuelve a ejecutar el script."
  fi
fi

if getent group docker &>/dev/null; then
  usermod -aG docker "$DEPLOY_USER"
  ok "Usuario '$DEPLOY_USER' añadido al grupo 'docker'"
fi

# ============================================================
# PASO 2 — Directorio de deploy
# ============================================================
step "Directorio de deploy: $DEPLOY_PATH"

if [[ -d "$DEPLOY_PATH/.git" ]]; then
  ok "Repositorio ya clonado en $DEPLOY_PATH"
else
  if [[ -d "$DEPLOY_PATH" ]]; then
    warn "$DEPLOY_PATH existe pero no es un repo git. Borrando..."
    rm -rf "$DEPLOY_PATH"
  fi
  log "Clonando $REPO_URL → $DEPLOY_PATH ..."
  git clone --branch "$REPO_BRANCH" "$REPO_URL" "$DEPLOY_PATH"
  ok "Repo clonado"
fi

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH"
ok "Permisos correctos en $DEPLOY_PATH"

# ============================================================
# PASO 3 — Clave SSH para GitHub Actions
# ============================================================
step "Clave SSH para GitHub Actions"

DEPLOY_SSH_DIR="/home/${DEPLOY_USER}/.ssh"
mkdir -p "$DEPLOY_SSH_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_SSH_DIR"
chmod 700 "$DEPLOY_SSH_DIR"

if [[ -f "$SSH_KEY_PATH" ]]; then
  warn "La clave $SSH_KEY_PATH ya existe. Omitiendo generación."
  warn "Si quieres regenerarla: rm $SSH_KEY_PATH $SSH_KEY_PATH.pub && vuelve a ejecutar."
else
  log "Generando par de claves ED25519..."
  sudo -u "$DEPLOY_USER" ssh-keygen \
    -t ed25519 \
    -C "github-actions-robeurope" \
    -f "$SSH_KEY_PATH" \
    -N ""
  ok "Clave generada en $SSH_KEY_PATH"
fi

# Autorizar la clave pública en el servidor
AUTHORIZED_KEYS="$DEPLOY_SSH_DIR/authorized_keys"
touch "$AUTHORIZED_KEYS"
chmod 600 "$AUTHORIZED_KEYS"

PUB_KEY=$(cat "${SSH_KEY_PATH}.pub")
if grep -qF "$PUB_KEY" "$AUTHORIZED_KEYS" 2>/dev/null; then
  ok "Clave pública ya está en authorized_keys"
else
  echo "$PUB_KEY" >> "$AUTHORIZED_KEYS"
  ok "Clave pública añadida a authorized_keys"
fi

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_SSH_DIR"

# ============================================================
# PASO 4 — Sudoers para docker compose sin contraseña
# ============================================================
step "Permisos sudo para docker compose"

SUDOERS_FILE="/etc/sudoers.d/robeurope-deploy"
cat > "$SUDOERS_FILE" << EOF
# Permite al usuario deploy recargar nginx sin contraseña
${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/bin/docker, /usr/local/bin/docker, /bin/systemctl reload nginx, /bin/systemctl reload nginx.service
EOF
chmod 440 "$SUDOERS_FILE"
ok "Sudoers configurado en $SUDOERS_FILE"

# ============================================================
# PASO 5 — Script de deploy en el servidor
# ============================================================
step "Script de deploy en servidor"

DEPLOY_SCRIPT="$DEPLOY_PATH/deploy-server.sh"
cat > "$DEPLOY_SCRIPT" << 'SCRIPT'
#!/usr/bin/env bash
# Ejecutado por GitHub Actions vía SSH
set -euo pipefail

DEPLOY_PATH="/opt/robeurope"
cd "$DEPLOY_PATH"

echo "[deploy] git pull..."
git pull origin main

echo "[deploy] docker compose build (prod)..."
docker compose --profile prod build --no-cache

echo "[deploy] docker compose up (prod)..."
docker compose --profile prod up -d

echo "[deploy] migraciones..."
docker compose --profile prod exec -T backend sh -c "node scripts/run-migrations.js" || true

echo "[deploy] ✓ Deploy completado"
SCRIPT

chmod +x "$DEPLOY_SCRIPT"
chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_SCRIPT"
ok "Script de deploy creado en $DEPLOY_SCRIPT"

# ============================================================
# PASO 6 — .env en producción
# ============================================================
step "Verificando .env de producción"

ENV_FILE="$DEPLOY_PATH/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  warn ".env NO encontrado en $DEPLOY_PATH"
  warn "Cópialo manualmente: cp /ruta/local/.env $ENV_FILE"
  warn "O créalo antes de lanzar el primer deploy."
else
  ok ".env ya existe en $DEPLOY_PATH"
fi

# ============================================================
# RESUMEN — Qué añadir en GitHub
# ============================================================
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "<ip-del-servidor>")
PRIVATE_KEY=$(cat "$SSH_KEY_PATH")

echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  ✓  Servidor preparado para GitHub Actions${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Ve a: ${CYAN}https://github.com/s-pl/RobEurope/settings/secrets/actions${NC}"
echo -e "  y añade los siguientes ${BOLD}Repository secrets${NC}:"
echo ""
echo -e "  ${YELLOW}DEPLOY_HOST${NC}"
echo -e "    ${SERVER_IP}"
echo ""
echo -e "  ${YELLOW}DEPLOY_USER${NC}"
echo -e "    ${DEPLOY_USER}"
echo ""
echo -e "  ${YELLOW}DEPLOY_PATH${NC}"
echo -e "    ${DEPLOY_PATH}"
echo ""
echo -e "  ${YELLOW}DEPLOY_SSH_KEY${NC}  (clave privada — copia TODO el bloque):"
echo -e "${RED}──────────────────────────────────────────────────────────${NC}"
echo "$PRIVATE_KEY"
echo -e "${RED}──────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "  ${YELLOW}DEPLOY_SSH_KEY_FINGERPRINT${NC} (para verificación opcional):"
ssh-keygen -lf "${SSH_KEY_PATH}.pub"
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "  El workflow en ${CYAN}.github/workflows/deploy.yml${NC} ya está en el repo."
echo -e "  Cada push a ${BOLD}main${NC} disparará el deploy automáticamente."
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
