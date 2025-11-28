# Multi‑stage build for Node + TypeScript + Prisma (npm workspaces)

FROM node:20-bullseye-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy only manifest files for dependency install (cache friendly)
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install all workspace deps
RUN npm ci

# Copy required source (avoid host node_modules / broken symlinks)
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/prisma backend/prisma
COPY backend/src backend/src
# Include shared workspace source if backend imports it
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/shared/src packages/shared/src

# Generate Prisma client
RUN npx -w backend prisma generate

# Build backend (expects dist output)
RUN npm run -w backend build

# Prune dev deps
RUN npm prune --omit=dev --workspaces

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy built app + minimal runtime files
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/prisma ./backend/prisma

EXPOSE 3000
CMD ["node", "backend/dist/server.js"]