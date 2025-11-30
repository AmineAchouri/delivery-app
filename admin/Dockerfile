# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files (lock file optional via wildcard)
COPY package*.json ./

# Install dependencies - use npm ci if lockfile exists, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Build the Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port 80 (standard HTTP)
EXPOSE 80

# Set environment variables
ENV PORT=80
ENV HOSTNAME="0.0.0.0"
ENV NEXT_PUBLIC_API_URL=""

# Start the application
CMD ["node", "server.js"]
