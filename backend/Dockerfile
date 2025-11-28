# Backend-only build (no workspaces)

FROM node:20-bullseye-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install backend deps
COPY backend/package.json backend/package.json
COPY backend/package-lock.json backend/package-lock.json
RUN npm ci --prefix backend

# Copy backend sources
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/src backend/src
COPY backend/prisma backend/prisma

# Generate Prisma and build
RUN npx -w backend prisma generate
RUN npm run -w backend build

# Prune dev deps for runtime
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