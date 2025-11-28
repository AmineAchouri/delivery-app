# Multi‑stage build for backend
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
# Use lockfile if present
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runnerrunner
WORKDIR /app
ENV NODE_ENV=productionuction
RUN apk add --no-cache opensslRUN apk add --no-cache openssl
# Copy only what is needed to run run
COPY --from=builder /app/node_modules ./node_modulesp/node_modules ./node_modules
COPY --from=builder /app/dist ./dist./dist
COPY --from=builder /app/package.json ./package.jsonn ./package.json
EXPOSE 3000
CMD ["node", "dist/server.js"]