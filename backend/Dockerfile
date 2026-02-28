# ============================================================
# Backend — Production image
# ============================================================
FROM node:20-alpine AS base
WORKDIR /app

# Install OS deps needed by some npm packages (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# Copy manifests first (better layer caching)
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy source
COPY . .

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 85

# Run migrations then start the server
CMD ["sh", "-c", "node scripts/run-migrations.js && node index.js"]
