# Root Dockerfile that builds the backend using npm workspaces

FROM node:20-bullseye-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy manifests for workspace install (cache friendly)
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install all workspace deps (includes dev deps for build)
RUN npm ci

# Copy only necessary source (avoid host node_modules and reparse points)
COPY backend/tsconfig.json backend/tsconfig.json
COPY backend/prisma backend/prisma
COPY backend/src backend/src
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/shared/src packages/shared/src

# Generate Prisma and build backend
RUN npx -w backend prisma generate
RUN npm run -w backend build

# Prune dev deps for production image
RUN npm prune --omit=dev --workspaces

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copy production deps and built backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma

EXPOSE 3000
CMD ["node", "backend/dist/server.js"]