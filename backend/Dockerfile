# Backend-only build (no workspaces)

FROM node:20-bullseye-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy manifests (lock file optional via wildcard)
COPY backend/package*.json backend/

# Install deps (use npm ci if lock exists, else npm install)
RUN if [ -f backend/package-lock.json ]; then npm ci --prefix backend; else npm install --prefix backend; fi

# Copy sources
COPY backend/tsconfig.json backend/
COPY backend/src backend/src
COPY backend/prisma backend/prisma

# Generate Prisma and build
RUN npx --prefix backend prisma generate
RUN npm run --prefix backend build

# Prune dev deps
RUN npm prune --omit=dev --prefix backend

FROM node:20-bullseye-slim AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/server.js"]