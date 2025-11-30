# Backend-only build (no workspaces)

FROM node:20-bullseye-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy manifests (lock file optional via wildcard)
COPY backend/package*.json backend/

# Install deps
RUN if [ -f backend/package-lock.json ]; then npm ci --prefix backend; else npm install --prefix backend; fi

# Copy sources
COPY backend/tsconfig.json backend/
COPY backend/src backend/src
COPY backend/prisma backend/prisma
COPY backend/openapi.yaml ./openapi.yaml

# Debug: confirm schema exists in image
RUN ls -la backend && ls -la backend/prisma

# Generate Prisma client with explicit schema path
RUN npx --prefix backend prisma generate --schema backend/prisma/schema.prisma

# Build
RUN npm run --prefix backend build

# Keep ts-node for seeding, then prune other dev deps
RUN cd backend && npm prune --omit=dev --ignore-scripts

FROM node:20-bullseye-slim AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/openapi.yaml ./openapi.yaml
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]