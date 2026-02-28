#!/usr/bin/env bash
# ============================================================
# RobEurope - Nginx Setup (Arquitectura split: Vercel + DO)
#
# ARQUITECTURA:
#   robeurope.samuelponce.es         → Vercel (frontend)
#   api.robeurope.samuelponce.es     → Este servidor (backend :85)
#   *.robeurope.samuelponce.es       → Este servidor (nginx proxies a Vercel)
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

# ── Cargar .env ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/.env" ]]; then
  set -a; source "$SCRIPT_DIR/.env"; set +a
  log "Variables cargadas desde .env"
fi

# ── Configuración (override desde .env) ─────────────────────
BACKEND_PORT="${PORT:-85}"
TEAM_DOMAIN="${TEAM_DOMAIN:-robeurope.samuelponce.es}"
# El host donde está el frontend de Vercel (subdominio raíz)
VERCEL_HOST="${VERCEL_HOST:-$TEAM_DOMAIN}"

NGINX_CONF_NAME="robeurope"
SITES_AVAILABLE="/etc/nginx/sites-available"
SITES_ENABLED="/etc/nginx/sites-enabled"

# ── Verificar root ───────────────────────────────────────────
[[ "$EUID" -ne 0 ]] && err "Ejecuta como root o con sudo."

step "Verificando nginx"
if ! command -v nginx &>/dev/null; then
  log "Instalando nginx..."
  if   command -v apt-get &>/dev/null; then apt-get update -qq && apt-get install -y nginx
  elif command -v dnf     &>/dev/null; then dnf install -y nginx
  elif command -v yum     &>/dev/null; then yum install -y nginx
  else err "No se pudo detectar el gestor de paquetes."; fi
  ok "nginx instalado"
else
  ok "nginx ya disponible"
fi

# Escapar el dominio para usarlo en regex de nginx
DOMAIN_REGEX=$(echo "$TEAM_DOMAIN" | sed 's/\./\\./g')

step "Generando configuración"
CONFIG_FILE="$SITES_AVAILABLE/$NGINX_CONF_NAME"

cat > "$CONFIG_FILE" << NGINX_EOF
# ============================================================
# RobEurope - Nginx Config  |  Generado: $(date)
#
#  api.${TEAM_DOMAIN}  →  backend en localhost:${BACKEND_PORT}
#  *.${TEAM_DOMAIN}    →  proxy transparente a Vercel (${VERCEL_HOST})
# ============================================================

# Upgrade de WebSocket
map \$http_upgrade \$connection_upgrade {
    default  upgrade;
    ''       close;
}

# ── API: api.${TEAM_DOMAIN} ─────────────────────────────────
#    Proxea directamente al backend Express en :${BACKEND_PORT}
server {
    listen 80;
    listen [::]:80;
    server_name api.${TEAM_DOMAIN};

    access_log /var/log/nginx/robeurope_api_access.log;
    error_log  /var/log/nginx/robeurope_api_error.log;

    client_max_body_size 50M;

    # WebSocket (Socket.IO)
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

    # API REST
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
#    Proxy transparente a Vercel.
#    El navegador ve el subdominio (equipo.robeurope.samuelponce.es)
#    por lo que el React detecta el slug y muestra la página del equipo.
#    Las llamadas a la API van directamente a api.${TEAM_DOMAIN}.
server {
    listen 80;
    listen [::]:80;

    # Captura cualquier subdominio EXCEPTO "api" y "www"
    server_name ~^(?P<team_slug>(?!api\$|www\$)[a-z0-9][a-z0-9\-]*)\.${DOMAIN_REGEX}\$;

    access_log /var/log/nginx/robeurope_teams_access.log;
    error_log  /var/log/nginx/robeurope_teams_error.log;

    # ── Proxy transparente a Vercel ─────────────────────────
    # Vercel sirve el build de React. El navegador sigue viendo
    # el subdominio del equipo, así que la detección funciona.
    location / {
        proxy_pass          https://${VERCEL_HOST};
        proxy_http_version  1.1;
        proxy_ssl_server_name on;

        # Host → Vercel para que sirva el proyecto correcto
        proxy_set_header    Host              ${VERCEL_HOST};

        # Preservar IP real
        proxy_set_header    X-Real-IP         \$remote_addr;
        proxy_set_header    X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto \$scheme;

        # Pasar el slug para uso futuro (middleware Vercel, etc.)
        proxy_set_header    X-Team-Slug       \$team_slug;

        # Sin buffering para SSE/streams
        proxy_buffering     off;
        proxy_read_timeout  60s;

        # Caché de assets estáticos (JS/CSS de Vite build)
        location ~* \.(js|css|woff2?|png|jpg|svg|ico)\$ {
            proxy_pass         https://${VERCEL_HOST};
            proxy_http_version 1.1;
            proxy_ssl_server_name on;
            proxy_set_header   Host ${VERCEL_HOST};
            proxy_cache_valid  200 1d;
            add_header         Cache-Control "public, max-age=86400";
        }
    }
}
NGINX_EOF

ok "Config escrita en $CONFIG_FILE"

# ── Activar sitio ────────────────────────────────────────────
step "Activando sitio"
ln -sf "$CONFIG_FILE" "$SITES_ENABLED/$NGINX_CONF_NAME"
ok "Symlink creado"

# Preguntar sobre el default
if [[ -f "$SITES_ENABLED/default" || -L "$SITES_ENABLED/default" ]]; then
  warn "Sitio 'default' detectado en sites-enabled."
  read -rp "  ¿Eliminarlo para evitar conflictos? [s/N] " ans
  [[ "${ans,,}" == "s" ]] && rm "$SITES_ENABLED/default" && ok "Default eliminado"
fi

# ── Test + Reload ────────────────────────────────────────────
step "Probando configuración"
nginx -t || err "Configuración inválida. Revisa $CONFIG_FILE"
ok "Configuración válida"

step "Recargando nginx"
if systemctl is-active --quiet nginx; then
  systemctl reload nginx; ok "nginx recargado"
else
  systemctl enable nginx; systemctl start nginx; ok "nginx iniciado"
fi

# ── SSL ──────────────────────────────────────────────────────
step "SSL (Let's Encrypt)"
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "<ip>")

echo ""
echo -e "  ${CYAN}REGISTROS DNS NECESARIOS:${NC}"
echo -e ""
echo -e "  ${GREEN}# Frontend en Vercel (apex domain)${NC}"
echo -e "  A      ${TEAM_DOMAIN}           → IP de Vercel  (76.76.21.21)"
echo -e "  CNAME  www.${TEAM_DOMAIN}       → cname.vercel-dns.com"
echo -e ""
echo -e "  ${GREEN}# Backend en este servidor (${SERVER_IP})${NC}"
echo -e "  A      api.${TEAM_DOMAIN}       → ${SERVER_IP}"
echo -e "  A      *.${TEAM_DOMAIN}         → ${SERVER_IP}   (páginas de equipos)"
echo -e ""
echo -e "  ${YELLOW}IMPORTANTE:${NC} El registro A explícito para 'api' tiene"
echo -e "  prioridad sobre el wildcard '*', así que ambos coexisten."
echo ""

if command -v certbot &>/dev/null; then
  echo -e "  Para el wildcard SSL se necesita un desafío DNS."
  echo -e "  ${CYAN}Opciones:${NC}"
  echo -e "  1. Manual (cualquier DNS):"
  echo -e "     ${CYAN}certbot certonly --manual --preferred-challenges dns \\\\"
  echo -e "       -d api.${TEAM_DOMAIN} -d '*.${TEAM_DOMAIN}'${NC}"
  echo ""
  echo -e "  2. Automático con plugin DigitalOcean:"
  echo -e "     ${CYAN}apt install python3-certbot-dns-digitalocean"
  echo -e "     certbot certonly --dns-digitalocean \\\\"
  echo -e "       --dns-digitalocean-credentials ~/.do-certbot.ini \\\\"
  echo -e "       -d api.${TEAM_DOMAIN} -d '*.${TEAM_DOMAIN}'${NC}"
  echo ""
  read -rp "  ¿Configurar SSL para api.${TEAM_DOMAIN} ahora (sin wildcard)? [s/N] " ssl_ans
  if [[ "${ssl_ans,,}" == "s" ]]; then
    certbot --nginx -d "api.${TEAM_DOMAIN}" \
      --agree-tos --redirect \
      || warn "SSL de api.${TEAM_DOMAIN} no pudo configurarse automáticamente."
    echo ""
    warn "Para el wildcard (*.${TEAM_DOMAIN}) usa el método manual o el plugin DO."
  fi
else
  warn "certbot no instalado. Para HTTPS:"
  echo -e "  ${CYAN}apt install certbot python3-certbot-nginx python3-certbot-dns-digitalocean${NC}"
fi

# ── Resumen ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓  nginx configurado para RobEurope (split-deploy)${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo -e "  API backend  : https://api.${TEAM_DOMAIN}  → :${BACKEND_PORT}"
echo -e "  Team pages   : https://<slug>.${TEAM_DOMAIN}  → Vercel proxy"
echo -e "  WebSockets   : habilitados en /socket.io/"
echo -e "${GREEN}══════════════════════════════════════════════════════════${NC}"
echo ""
