#!/usr/bin/env bash
# ============================================================
# RobEurope - Nginx Setup (Arquitectura split: Vercel + DO)
#
# ARQUITECTURA:
#   robeurope.samuelponce.es         → Vercel (frontend)
#   api.robeurope.samuelponce.es     → Este servidor (backend :85)
#   *.robeurope.samuelponce.es       → Este servidor (nginx proxy a Vercel)
#
# DNS NECESARIO:
#   A     api.robeurope.samuelponce.es   → <esta IP>
#   A     *.robeurope.samuelponce.es     → <esta IP>
#   A/CNAME robeurope.samuelponce.es    → Vercel
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${BLUE}[INFO]${NC} $*"; }
ok()   { echo -e "${GREEN}[ OK ]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERR ]${NC} $*"; exit 1; }
step() { echo -e "\n${CYAN}══════ $* ══════${NC}"; }

[[ "$EUID" -ne 0 ]] && err "Ejecuta como root o con sudo."

# ── Cargar .env ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$SCRIPT_DIR/.env" ]] && { set -a; source "$SCRIPT_DIR/.env"; set +a; log ".env cargado"; }

# ── Configuración ────────────────────────────────────────────
BACKEND_PORT="${PORT:-85}"
TEAM_DOMAIN="${TEAM_DOMAIN:-robeurope.samuelponce.es}"
VERCEL_HOST="${VERCEL_HOST:-$TEAM_DOMAIN}"
CERT_NAME="robeurope"
CERT_DIR="/etc/letsencrypt/live/${CERT_NAME}"
DO_CREDS_FILE="/root/.secrets/do-certbot.ini"

NGINX_CONF_NAME="robeurope"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"
CONFIG_FILE="$SITES_AVAILABLE/$NGINX_CONF_NAME"

DOMAIN_REGEX=$(echo "$TEAM_DOMAIN" | sed 's/\./\\./g')

# ── Parámetros SSL ───────────────────────────────────────────
CERT_FULLCHAIN="$CERT_DIR/fullchain.pem"
CERT_KEY="$CERT_DIR/privkey.pem"

# ============================================================
# Funciones de generación de config nginx
# ============================================================

ssl_params() {
  cat << 'EOF'
    ssl_certificate     CERT_FULLCHAIN_PLACEHOLDER;
    ssl_certificate_key CERT_KEY_PLACEHOLDER;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
EOF
}

write_nginx_config() {
  local WITH_SSL="${1:-false}"

  local API_LISTEN TEAM_LISTEN SSL_BLOCK=""
  if [[ "$WITH_SSL" == "true" ]]; then
    API_LISTEN="listen 443 ssl;\n    listen [::]:443 ssl;"
    TEAM_LISTEN="listen 443 ssl;\n    listen [::]:443 ssl;"
    SSL_BLOCK=$(ssl_params \
      | sed "s|CERT_FULLCHAIN_PLACEHOLDER|${CERT_FULLCHAIN}|g" \
      | sed "s|CERT_KEY_PLACEHOLDER|${CERT_KEY}|g")
  else
    API_LISTEN="listen 80;\n    listen [::]:80;"
    TEAM_LISTEN="listen 80;\n    listen [::]:80;"
  fi

  cat > "$CONFIG_FILE" << NGINX_EOF
# ============================================================
# RobEurope - Nginx Config  |  Generado: $(date)
#  api.${TEAM_DOMAIN}  →  backend localhost:${BACKEND_PORT}
#  *.${TEAM_DOMAIN}    →  proxy transparente a Vercel
# ============================================================

map \$http_upgrade \$connection_upgrade {
    default upgrade;
    ''      close;
}

# ── Redirect HTTP → HTTPS ────────────────────────────────────
$(if [[ "$WITH_SSL" == "true" ]]; then cat << REDIRECT
server {
    listen 80;
    listen [::]:80;
    server_name api.${TEAM_DOMAIN} ~^(?!api\$|www\$)[a-z0-9][a-z0-9\-]*\.${DOMAIN_REGEX}\$;
    return 301 https://\$host\$request_uri;
}
REDIRECT
fi)

# ── API: api.${TEAM_DOMAIN} ──────────────────────────────────
server {
    $(echo -e "$API_LISTEN")
    server_name api.${TEAM_DOMAIN};
$(echo "$SSL_BLOCK")

    access_log /var/log/nginx/robeurope_api_access.log;
    error_log  /var/log/nginx/robeurope_api_error.log;

    client_max_body_size 50M;

    location /socket.io/ {
        proxy_pass         http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade           \$http_upgrade;
        proxy_set_header   Connection        \$connection_upgrade;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_buffering    off;
        proxy_read_timeout 86400s;
    }

    location / {
        proxy_pass         http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout    120s;
        proxy_read_timeout    120s;
    }
}

# ── EQUIPOS: <slug>.${TEAM_DOMAIN} ──────────────────────────
server {
    $(echo -e "$TEAM_LISTEN")
    server_name ~^(?P<team_slug>(?!api\$|www\$)[a-z0-9][a-z0-9\-]*)\.${DOMAIN_REGEX}\$;
$(echo "$SSL_BLOCK")

    access_log /var/log/nginx/robeurope_teams_access.log;
    error_log  /var/log/nginx/robeurope_teams_error.log;

    location / {
        proxy_pass          https://${VERCEL_HOST};
        proxy_http_version  1.1;
        proxy_ssl_server_name on;
        proxy_set_header    Host              ${VERCEL_HOST};
        proxy_set_header    X-Real-IP         \$remote_addr;
        proxy_set_header    X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto \$scheme;
        proxy_set_header    X-Team-Slug       \$team_slug;
        proxy_buffering     off;
        proxy_read_timeout  60s;

        location ~* \.(js|css|woff2?|png|jpg|svg|ico)\$ {
            proxy_pass          https://${VERCEL_HOST};
            proxy_http_version  1.1;
            proxy_ssl_server_name on;
            proxy_set_header    Host ${VERCEL_HOST};
            proxy_cache_valid   200 1d;
            add_header          Cache-Control "public, max-age=86400";
        }
    }
}
NGINX_EOF

  ok "Config escrita $(if [[ "$WITH_SSL" == "true" ]]; then echo "(SSL)"; else echo "(HTTP)"; fi)"
}

# ============================================================
# PASO 1 — Instalar nginx
# ============================================================
step "Verificando nginx"
if ! command -v nginx &>/dev/null; then
  log "Instalando nginx..."
  if   command -v apt-get &>/dev/null; then apt-get update -qq && apt-get install -y nginx
  elif command -v dnf     &>/dev/null; then dnf install -y nginx
  elif command -v yum     &>/dev/null; then yum install -y nginx
  else err "No se detectó gestor de paquetes (apt/dnf/yum)."; fi
  ok "nginx instalado"
else
  ok "nginx ya disponible"
fi

# ============================================================
# PASO 2 — Config HTTP inicial (necesaria antes del SSL)
# ============================================================
step "Generando config HTTP inicial"
write_nginx_config false

ln -sf "$CONFIG_FILE" "$SITES_ENABLED/$NGINX_CONF_NAME"

if [[ -L "$SITES_ENABLED/default" || -f "$SITES_ENABLED/default" ]]; then
  warn "Eliminando sitio 'default' para evitar conflictos..."
  rm -f "$SITES_ENABLED/default"
fi

nginx -t || err "Config nginx inválida. Revisa $CONFIG_FILE"
if systemctl is-active --quiet nginx 2>/dev/null; then
  systemctl reload nginx
else
  systemctl enable --now nginx
fi
ok "nginx arriba con config HTTP"

# ============================================================
# PASO 3 — SSL wildcard con Let's Encrypt + plugin DigitalOcean
# ============================================================
step "SSL wildcard (*.${TEAM_DOMAIN})"

# ¿Ya existe el certificado?
if [[ -f "$CERT_FULLCHAIN" && -f "$CERT_KEY" ]]; then
  ok "Certificado wildcard ya existe en $CERT_DIR"
  HAVE_CERT=true
else
  HAVE_CERT=false
fi

if [[ "$HAVE_CERT" == "false" ]]; then
  echo ""
  echo -e "  El certificado wildcard requiere el ${CYAN}plugin DNS de DigitalOcean${NC}."
  echo -e "  Necesitas un ${YELLOW}token de API de DigitalOcean${NC} con permiso de escritura en DNS."
  echo ""
  read -rp "  ¿Configurar SSL wildcard ahora? [s/N] " ssl_ans
  if [[ "${ssl_ans,,}" != "s" ]]; then
    warn "SSL omitido. Los subdominios irán por HTTP por ahora."
    warn "Vuelve a ejecutar este script cuando tengas el token de DO."
    exit 0
  fi

  # Instalar certbot + plugin DO
  step "Instalando certbot + plugin DigitalOcean"
  if command -v apt-get &>/dev/null; then
    apt-get install -y certbot python3-certbot-nginx python3-certbot-dns-digitalocean
  elif command -v dnf &>/dev/null; then
    dnf install -y certbot python3-certbot-dns-digitalocean
  else
    pip3 install certbot certbot-dns-digitalocean 2>/dev/null \
      || err "No se pudo instalar certbot. Instálalo manualmente."
  fi
  ok "certbot instalado"

  # Token de DigitalOcean
  echo ""
  read -rsp "  Pega tu token de API de DigitalOcean (se guardará en $DO_CREDS_FILE): " DO_TOKEN
  echo ""
  [[ -z "$DO_TOKEN" ]] && err "Token vacío."

  mkdir -p "$(dirname "$DO_CREDS_FILE")"
  cat > "$DO_CREDS_FILE" << EOF
dns_digitalocean_token = ${DO_TOKEN}
EOF
  chmod 600 "$DO_CREDS_FILE"
  ok "Credenciales guardadas (modo 600)"

  # Solicitar certificado wildcard + api
  step "Solicitando certificado wildcard"
  log "Esto puede tardar ~30 segundos mientras DigitalOcean propaga el registro DNS..."
  certbot certonly \
    --dns-digitalocean \
    --dns-digitalocean-credentials "$DO_CREDS_FILE" \
    --dns-digitalocean-propagation-seconds 30 \
    --cert-name "$CERT_NAME" \
    -d "*.${TEAM_DOMAIN}" \
    -d "api.${TEAM_DOMAIN}" \
    --agree-tos --non-interactive \
    --email "admin@${TEAM_DOMAIN}" \
    || err "certbot falló. Revisa los logs: journalctl -u certbot"

  ok "Certificado emitido en $CERT_DIR"
  HAVE_CERT=true
fi

# ============================================================
# PASO 4 — Reescribir config nginx con SSL
# ============================================================
if [[ "$HAVE_CERT" == "true" ]]; then
  step "Generando config nginx con SSL"
  write_nginx_config true
  nginx -t || err "Config SSL inválida."
  systemctl reload nginx
  ok "nginx recargado con HTTPS"

  # Auto-renovación
  step "Auto-renovación de certificados"
  if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -
    ok "Cron de renovación añadido (03:00 diario)"
  else
    ok "Cron de renovación ya existe"
  fi
fi

# ── Resumen ──────────────────────────────────────────────────
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "<ip>")
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓  nginx configurado para RobEurope${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "  API backend  : https://api.${TEAM_DOMAIN}  →  :${BACKEND_PORT}"
echo -e "  Team pages   : https://<slug>.${TEAM_DOMAIN}  →  Vercel"
echo -e "  HTTP → HTTPS : redireccionamiento automático"
echo -e "  Cert         : $CERT_DIR"
echo ""
echo -e "  ${CYAN}DNS requerido:${NC}"
echo -e "  A  api.${TEAM_DOMAIN}  →  ${SERVER_IP}"
echo -e "  A  *.${TEAM_DOMAIN}   →  ${SERVER_IP}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
