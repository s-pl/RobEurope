# RobEurope — Guía de instalación y configuración

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Instalación rápida (desarrollo)](#2-instalación-rápida-desarrollo)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Arquitectura Docker](#4-arquitectura-docker)
5. [Comandos útiles](#5-comandos-útiles)
6. [Despliegue en producción](#6-despliegue-en-producción)
7. [Sistema de slugs y páginas de equipo](#7-sistema-de-slugs-y-páginas-de-equipo)
8. [Configuración de nginx + SSL (producción)](#8-configuración-de-nginx--ssl-producción)
9. [Bases de datos](#9-bases-de-datos)
10. [Solución de problemas](#10-solución-de-problemas)

---

## 1. Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Docker | 24+ |
| Docker Compose plugin | v2 (`docker compose`) |
| Git | cualquier versión reciente |

> **Solo necesitas Docker.** Node.js **no** hace falta en el host; todo se ejecuta dentro de contenedores.

---

## 2. Instalación rápida (desarrollo)

```bash
# 1. Clona el repositorio
git clone https://github.com/s-pl/RobEurope
cd robeurope

# 2. Copia y edita el archivo de entorno
cp .env.example .env
# Edita .env con tus valores (ver sección 3)

# 3. Build inicial (construye imágenes, aplica migraciones y seeders)
chmod +x build.sh start.sh
./build.sh          # → modo dev por defecto

# 4. Arranca todo
./start.sh          # → http://localhost:5173 (frontend)
                    # → http://localhost:85   (backend API)
```

Para parar:

```bash
./start.sh stop
```

---

## 3. Variables de entorno

Copia `.env.example` como `.env` en la raíz y rellena los valores:

```dotenv
# === Docker / MySQL ===
MYSQL_ROOT_PASSWORD=rootpassword        # Contraseña root de MySQL
MYSQL_USER=robeurope_user               # Usuario de la app
MYSQL_PASSWORD=devpassword              # Contraseña del usuario
MYSQL_HOST_PORT=3306                    # Puerto expuesto en el host
REDIS_HOST_PORT=6379                    # Puerto Redis expuesto en el host

# === Base de datos por entorno ===
DB_NAME_DEV=robeurope_dev
DB_NAME_TEST=robeurope_test
DB_NAME_PROD=robeurope_prod

# === Aplicación ===
PORT=85
SESSION_SECRET=cambia_esto_por_algo_largo_y_aleatorio

# === Dominio (producción) ===
TEAM_DOMAIN=robeurope.samuelponce.es
COOKIE_DOMAIN=.robeurope.samuelponce.es

# === Frontend (baked en build time) ===
VITE_API_BASE_URL=http://localhost:85
VITE_WS_URL=ws://localhost:85
VITE_APP_NAME=RobEurope Dev
VITE_TEAM_DOMAIN=localhost

# === OAuth (opcional en dev) ===
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# === Email (Resend) ===
RESEND_API_KEY=

# === Push notifications (VAPID) ===
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

> Las variables `VITE_*` se incrustan en el bundle de React en tiempo de build.
> Si las cambias, debes reconstruir la imagen del frontend:
> ```bash
> docker compose --profile dev build frontend-dev
> ```

---

## 4. Arquitectura Docker

```
docker-compose.yml
├── mysql          (perfil: dev + prod)  — MySQL 8.0, 3 bases de datos
├── redis          (perfil: dev + prod)  — Redis 7
├── backend-dev    (perfil: dev)         — Node + nodemon, código montado en volumen
├── frontend-dev   (perfil: dev)         — Vite dev server, código montado en volumen
├── backend        (perfil: prod)        — Node producción (npm ci --omit=dev)
└── frontend       (perfil: prod)        — nginx sirviendo el bundle de Vite
```

### Bases de datos creadas automáticamente

El archivo `docker/mysql/init.sql` crea al primer arranque:

| Base de datos    | Uso               |
|------------------|-------------------|
| `robeurope_dev`  | Desarrollo local  |
| `robeurope_test` | Tests automáticos |
| `robeurope_prod` | Producción        |

El usuario `robeurope_user` tiene `ALL PRIVILEGES` en las tres.

### Volúmenes nombrados

| Volumen               | Contenido                       |
|-----------------------|---------------------------------|
| `mysql_data`          | Datos de MySQL (persistente)    |
| `redis_data`          | Datos de Redis (persistente)    |
| `backend_uploads`     | Archivos subidos (persistente)  |
| `backend_node_modules`| `node_modules` del backend      |
| `frontend_node_modules`| `node_modules` del frontend    |

Los `node_modules` en volúmenes nombrados evitan conflictos entre el sistema de archivos del host y el del contenedor (diferentes plataformas/arquitecturas).

---

## 5. Comandos útiles

```bash
# Arrancar en modo desarrollo
./start.sh

# Arrancar en modo producción
./start.sh prod

# Parar todo
./start.sh stop

# Ver logs en tiempo real
docker compose --profile dev logs -f
docker compose --profile dev logs -f backend-dev   # solo backend

# Ejecutar migraciones manualmente
docker compose --profile dev exec backend-dev node scripts/run-migrations.js

# Ejecutar seeders manualmente
docker compose --profile dev exec backend-dev node scripts/run-seeders.js

# Reiniciar un servicio
docker compose --profile dev restart backend-dev

# Rebuild una imagen concreta (tras cambiar el Dockerfile o package.json)
docker compose --profile dev build backend-dev

# Acceder a MySQL directamente
docker exec -it robeurope-mysql mysql -u robeurope_user -pdevpassword robeurope_dev

# Acceder a Redis
docker exec -it robeurope-redis redis-cli

# Borrar volúmenes (¡borra todos los datos!)
docker compose --profile dev down -v
```

---

## 6. Despliegue en producción

### En un VPS (todo en Docker)

```bash
# 1. Clona el repo en el servidor
git clone https://github.com/tu-usuario/robeurope.git
cd robeurope

# 2. Crea el .env de producción
cp .env.example .env
nano .env
# Pon valores reales: contraseñas fuertes, SESSION_SECRET largo, etc.

# También actualiza las VITE_ vars para producción:
# VITE_API_BASE_URL=https://api.robeurope.samuelponce.es
# VITE_WS_URL=wss://api.robeurope.samuelponce.es
# VITE_TEAM_DOMAIN=robeurope.samuelponce.es

# 3. Build + migraciones
./build.sh prod

# 4. Arrancar
./start.sh prod

# El backend escucha en :85, el frontend en :3000
# Configura nginx como reverse proxy (ver sección 8)
```

### Despliegue split (backend en DO, frontend en Vercel)

Si el frontend está en Vercel y solo el backend en DigitalOcean:

```bash
# En DigitalOcean — solo arranca el backend + infra
docker compose --profile prod up -d mysql redis backend
```

El frontend se despliega automáticamente vía Vercel al hacer push a `main`.
Asegúrate de que las variables de entorno de Vercel (`VITE_*`) apuntan a la URL del backend.

### Backend con PM2 (sin Docker)

Si ejecutas el backend directamente en el VPS y quieres que **no se apague al cerrar SSH**, usa PM2:

```bash
cd /ruta/a/RobEurope
./setup-pm2-backend.sh
```

Comandos habituales:

```bash
pm2 list
pm2 logs robeurope-backend
pm2 restart robeurope-backend
pm2 save
```

También puedes usar scripts npm del backend:

```bash
cd backend
npm run start:pm2
npm run restart:pm2
npm run stop:pm2
npm run logs:pm2
```

---

## 7. Sistema de slugs y páginas de equipo

### ¿Cómo funciona?

Cuando se crea un equipo, el backend genera automáticamente un **slug** único a partir del nombre:

- `"Robots FC"` → `robots-fc`
- `"Equipo Número 1"` → `equipo-numero-1`
- Si el slug ya existe, añade un sufijo: `robots-fc-2`, `robots-fc-3`, etc.

### URL de la página pública

```
https://[slug].robeurope.samuelponce.es
```

o, si estás usando rutas normales (sin subdominio):

```
https://robeurope.samuelponce.es/teams/[slug]/page
```

### Configurar subdominios

**1. DNS** — Añade un registro wildcard en tu proveedor DNS:

```
A  *.robeurope.samuelponce.es  →  [IP del servidor]
A  robeurope.samuelponce.es    →  [IP del servidor / Vercel]
```

**2. nginx** — El script `setup-nginx.sh` configura automáticamente el proxy:

```bash
chmod +x setup-nginx.sh
sudo ./setup-nginx.sh
```

Esto crea bloques nginx para:
- `api.robeurope.samuelponce.es` → backend :85
- `*.robeurope.samuelponce.es`   → frontend (Vercel o :3000)

**3. SSL wildcard** — Los certificados wildcard requieren el desafío DNS-01:

```bash
# Instala el plugin de DigitalOcean
pip3 install certbot-dns-digitalocean

# Crea el archivo de credenciales
mkdir -p /root/.secrets
cat > /root/.secrets/digitalocean.ini <<EOF
dns_digitalocean_token = TU_TOKEN_DE_DIGITALOCEAN_API
EOF
chmod 600 /root/.secrets/digitalocean.ini

# Solicita el certificado wildcard
certbot certonly \
  --dns-digitalocean \
  --dns-digitalocean-credentials /root/.secrets/digitalocean.ini \
  -d "robeurope.samuelponce.es" \
  -d "*.robeurope.samuelponce.es"
```

### Variables de entorno para slugs

```dotenv
# backend/.env o .env
TEAM_DOMAIN=robeurope.samuelponce.es

# frontend (baked en build)
VITE_TEAM_DOMAIN=robeurope.samuelponce.es
```

### API endpoints del sistema de páginas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET`  | `/api/teams/by-slug/:slug` | Datos públicos del equipo por slug |
| `GET`  | `/api/teams/:id/page`      | Layout y configuración de la página |
| `PUT`  | `/api/teams/:id/page`      | Actualizar página (requiere ser miembro) |

### Módulos disponibles en el editor drag-and-drop

| ID | Nombre | Descripción |
|----|--------|-------------|
| `hero` | Banner principal | Logo, nombre, descripción del equipo |
| `stats` | Estadísticas | Miembros, competiciones, aprobaciones |
| `members` | Equipo | Grid de miembros con avatares y roles |
| `posts` | Publicaciones | Últimas entradas del equipo |
| `competitions` | Competiciones | Registros y estados |
| `about` | Sobre nosotros | Texto libre editable |
| `gallery` | Galería | Imágenes con lightbox |
| `robots` | Robots | Archivos públicos del robot |
| `countdown` | Cuenta atrás | Próxima competición aprobada |
| `social` | Redes sociales | Links a redes del equipo |

---

## 8. Configuración de nginx + SSL (producción)

```bash
# Instala nginx si no está
sudo apt install -y nginx

# Ejecuta el script de configuración automática
chmod +x setup-nginx.sh
sudo ./setup-nginx.sh
```

El script configura:
- Reverse proxy `api.robeurope.samuelponce.es` → `localhost:85`
- Subdomains `*.robeurope.samuelponce.es` → Vercel (o `localhost:3000` si todo en DO)
- WebSocket upgrade para Socket.IO
- Cabeceras de seguridad

Después del script, solicita los certificados SSL (ver sección 7).

---

## 9. Bases de datos

### Entornos

El backend elige la DB según `NODE_ENV`:

| `NODE_ENV` | Variables usadas |
|---|---|
| `development` | `DB_HOST_DEV`, `DB_PORT_DEV`, `DB_NAME_DEV`, `DB_USER_DEV`, `DB_PASS_DEV` |
| `test` | `DB_HOST_TEST`, … |
| `production` | `DB_HOST_PROD`, … |

Dentro de Docker Compose, el host es siempre `mysql` (nombre del servicio).

### Migraciones

Las migraciones se ejecutan automáticamente:
- En `build.sh` (primer setup)
- Al arrancar el contenedor de producción (CMD en `Dockerfile`)

Para ejecutarlas manualmente:

```bash
# Dev
docker compose --profile dev exec backend-dev node scripts/run-migrations.js

# Prod
docker compose --profile prod exec backend node scripts/run-migrations.js
```

Todas las migraciones son **idempotentes**: se pueden ejecutar varias veces sin error.

### Seeders

Los seeders crean datos iniciales (superadmin, categorías, etc.):

```bash
docker compose --profile dev exec backend-dev node scripts/run-seeders.js
```

### Acceso directo a MySQL

```bash
docker exec -it robeurope-mysql mysql -u robeurope_user -p robeurope_dev
```

---

## 10. Solución de problemas

### MySQL no arranca

```bash
docker logs robeurope-mysql
```

Causas comunes:
- Puerto 3306 ya ocupado → cambia `MYSQL_HOST_PORT` en `.env`
- Volumen corrompido → `docker compose down -v` (¡borra datos!)

### "SESSION_SECRET is required in production"

Añade `SESSION_SECRET` al `.env` con un valor aleatorio largo:

```bash
openssl rand -base64 64
```

### El frontend no puede conectar con el backend (CORS)

Verifica que `VITE_API_BASE_URL` en `.env` apunta a la URL correcta del backend.
En dev: `http://localhost:85`. En prod: `https://api.robeurope.samuelponce.es`.

Si cambias la URL, rebuild el frontend:

```bash
docker compose --profile dev build frontend-dev
# o
docker compose --profile prod build frontend
```

### node_modules desincronizados (error de módulo no encontrado)

Los volúmenes nombrados almacenan los `node_modules` del contenedor.
Si añades un paquete a `package.json`, rebuild la imagen:

```bash
docker compose --profile dev build backend-dev
```

### Subdominio no resuelve

1. Verifica el registro DNS wildcard (`*.robeurope.samuelponce.es`)
2. Espera la propagación DNS (hasta 48h, normalmente minutos)
3. Verifica nginx: `sudo nginx -t && sudo systemctl reload nginx`
4. Revisa logs: `sudo tail -f /var/log/nginx/error.log`

### Ver todos los logs en tiempo real

```bash
docker compose --profile dev logs -f
```
