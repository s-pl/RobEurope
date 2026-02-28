#!/usr/bin/env bash
# ============================================================
# RobEurope - Nginx Proxy Setup
# Proxy: puerto 80 → 85 (backend/frontend)
# Soporte: WebSockets, subdominios wildcard de equipos
# ============================================================
set -euo pipefail

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step() { echo -e "\n${CYAN}══ $* ══${NC}"; }

# ── Load .env ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
  log "Variables cargadas desde $ENV_FILE"
else
  warn "No se encontró .env, usando valores por defecto"
fi

# ── Config (override via .env) ───────────────────────────────
APP_PORT="${PORT:-85}"
TEAM_DOMAIN="${TEAM_DOMAIN:-robeurope.samuelponce.es}"
NGINX_CONF_NAME="robeurope"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

step "RobEurope Nginx Setup"
log "Dominio principal : $TEAM_DOMAIN"
log "Puerto de la app  : $APP_PORT"
log "Subdominios equipo: *.$TEAM_DOMAIN → :$APP_PORT"

# ── Check root ───────────────────────────────────────────────
if [[ "$EUID" -ne 0 ]]; then
  err "Ejecuta este script como root o con sudo."
fi

# ── Install nginx if needed ──────────────────────────────────
step "Verificando nginx"
if ! command -v nginx &>/dev/null; then
  log "Nginx no encontrado. Instalando..."
  if command -v apt-get &>/dev/null; then
    apt-get update -qq && apt-get install -y nginx
  elif command -v yum &>/dev/null; then
    yum install -y nginx
  elif command -v dnf &>/dev/null; then
    dnf install -y nginx
  else
    err "No se pudo detectar el gestor de paquetes. Instala nginx manualmente."
  fi
  ok "Nginx instalado"
else
  ok "Nginx ya está instalado ($(nginx -v 2>&1 | head -1))"
fi

# ── Write nginx config ───────────────────────────────────────
step "Generando configuración nginx"

CONFIG_FILE="$NGINX_SITES_AVAILABLE/$NGINX_CONF_NAME"

cat > "$CONFIG_FILE" << NGINX_CONF
# ============================================================
# RobEurope - Nginx Proxy Config
# Generado por setup-nginx.sh — $(date)
# ============================================================

# Mapa para detectar si la conexión es un WebSocket upgrade
map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

# ── Servidor principal: ${TEAM_DOMAIN} ──────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name ${TEAM_DOMAIN};

    # Logs específicos de RobEurope
    access_log /var/log/nginx/${NGINX_CONF_NAME}_access.log;
    error_log  /var/log/nginx/${NGINX_CONF_NAME}_error.log;

    # Tamaño máximo de carga (subida de archivos, logos, etc.)
    client_max_body_size 50M;

    # Timeouts generosos para operaciones largas
    proxy_connect_timeout 60s;
    proxy_send_timeout    120s;
    proxy_read_timeout    120s;

    # ── WebSockets (Socket.IO) ──────────────────────────────
    location /socket.io/ {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        \$connection_upgrade;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_buffering    off;
        proxy_cache_bypass \$http_upgrade;
    }

    # ── API principal ───────────────────────────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_set_header   X-Team-Slug       "";
    }

    # ── Todo lo demás (frontend React) ─────────────────────
    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        \$connection_upgrade;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_buffering    off;

        # Fallback SPA: para rutas de React Router
        proxy_intercept_errors on;
        error_page 404 = @fallback;
    }

    location @fallback {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_set_header Host \$host;
    }
}

# ── Subdominios de equipos: *.${TEAM_DOMAIN} ────────────────
# Cada equipo tiene su propia página en <slug>.${TEAM_DOMAIN}
server {
    listen 80;
    listen [::]:80;

    # Captura el slug del equipo desde el subdominio
    server_name ~^(?P<team_slug>[a-z0-9][a-z0-9\-]*)\.$(echo "$TEAM_DOMAIN" | sed 's/\./\\./g')\$;

    access_log /var/log/nginx/${NGINX_CONF_NAME}_teams_access.log;
    error_log  /var/log/nginx/${NGINX_CONF_NAME}_teams_error.log;

    client_max_body_size 50M;
    proxy_connect_timeout 60s;
    proxy_send_timeout    120s;
    proxy_read_timeout    120s;

    # ── WebSockets ─────────────────────────────────────────
    location /socket.io/ {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        \$connection_upgrade;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_buffering    off;
        proxy_cache_bypass \$http_upgrade;
    }

    # ── API (el slug se pasa como header para que el backend sepa de qué equipo) ──
    location /api/ {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        # Header personalizado con el slug del equipo
        proxy_set_header   X-Team-Slug       \$team_slug;
    }

    # ── Frontend SPA ────────────────────────────────────────
    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        \$connection_upgrade;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        # El React app detecta el subdomain y muestra la página del equipo
        proxy_set_header   X-Team-Slug       \$team_slug;
        proxy_buffering    off;
    }
}
NGINX_CONF

ok "Configuración escrita en $CONFIG_FILE"

# ── Enable site ──────────────────────────────────────────────
step "Activando sitio"

SYMLINK="$NGINX_SITES_ENABLED/$NGINX_CONF_NAME"
if [[ -L "$SYMLINK" ]]; then
  rm "$SYMLINK"
  log "Symlink existente eliminado"
fi

ln -s "$CONFIG_FILE" "$SYMLINK"
ok "Sitio activado: $SYMLINK"

# Eliminar el sitio default de nginx si interfiere
DEFAULT_SYMLINK="$NGINX_SITES_ENABLED/default"
if [[ -L "$DEFAULT_SYMLINK" || -f "$DEFAULT_SYMLINK" ]]; then
  warn "Encontrado sitio 'default' en sites-enabled."
  read -rp "  ¿Eliminar el sitio default para evitar conflictos? [s/N] " answer
  if [[ "${answer,,}" == "s" ]]; then
    rm "$DEFAULT_SYMLINK"
    ok "Sitio default eliminado"
  fi
fi

# ── Test config ──────────────────────────────────────────────
step "Probando configuración nginx"
if nginx -t; then
  ok "Configuración nginx válida"
else
  err "Error en la configuración nginx. Revisa $CONFIG_FILE"
fi

# ── Reload/start nginx ───────────────────────────────────────
step "Recargando nginx"
if systemctl is-active --quiet nginx; then
  systemctl reload nginx
  ok "Nginx recargado"
else
  systemctl enable nginx
  systemctl start nginx
  ok "Nginx iniciado y habilitado"
fi

# ── DNS reminder ─────────────────────────────────────────────
step "Configuración DNS necesaria"
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "<tu-ip>")
echo ""
echo -e "  Añade los siguientes registros DNS en tu proveedor:"
echo -e ""
echo -e "  ${CYAN}Tipo   Nombre                        Valor${NC}"
echo -e "  ${GREEN}A      ${TEAM_DOMAIN}           ${SERVER_IP}${NC}"
echo -e "  ${GREEN}A      *.${TEAM_DOMAIN}         ${SERVER_IP}${NC}"
echo -e ""
echo -e "  El registro wildcard ${YELLOW}*.${TEAM_DOMAIN}${NC} permite que cada"
echo -e "  equipo tenga su propio subdominio automáticamente."
echo -e ""

# ── Optional SSL ─────────────────────────────────────────────
if command -v certbot &>/dev/null; then
  echo ""
  read -rp "¿Configurar SSL con Let's Encrypt (certbot)? [s/N] " ssl_answer
  if [[ "${ssl_answer,,}" == "s" ]]; then
    log "Configurando SSL para $TEAM_DOMAIN y *.$TEAM_DOMAIN..."
    log "NOTA: El wildcard SSL requiere un desafío DNS. Asegúrate de tener"
    log "      el plugin de certbot para tu proveedor DNS instalado."
    certbot --nginx -d "$TEAM_DOMAIN" -d "*.$TEAM_DOMAIN" \
      --agree-tos --redirect \
      || warn "SSL no configurado automáticamente. Configúralo manualmente."
  fi
else
  warn "certbot no está instalado. Para HTTPS ejecuta:"
  echo -e "  ${CYAN}apt-get install certbot python3-certbot-nginx${NC}"
  echo -e "  ${CYAN}certbot --nginx -d $TEAM_DOMAIN -d '*.$TEAM_DOMAIN'${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Nginx configurado correctamente para RobEurope${NC}"
echo -e "${GREEN}  Principal: http://${TEAM_DOMAIN} → :${APP_PORT}${NC}"
echo -e "${GREEN}  Equipos:   http://<slug>.${TEAM_DOMAIN} → :${APP_PORT}${NC}"
echo -e "${GREEN}  WebSockets: habilitados en /socket.io/${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
