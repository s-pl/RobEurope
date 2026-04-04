# ============================================================
# Frontend — Production image
# Stage 1: build with Vite
# Stage 2: serve with nginx
# ============================================================

# --- Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

# VITE_ env vars must be available at BUILD time
ARG VITE_API_BASE_URL=http://localhost:85
ARG VITE_WS_URL=ws://localhost:85
ARG VITE_APP_NAME=RobEurope
ARG VITE_TEAM_DOMAIN=robeurope.samuelponce.es

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_TEAM_DOMAIN=$VITE_TEAM_DOMAIN

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# --- Server ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
