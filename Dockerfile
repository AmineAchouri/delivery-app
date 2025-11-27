FROM node:20-alpine AS build
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci
COPY backend/ ./backend/
RUN cd backend && npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
EXPOSE 3000
CMD ["node","dist/server.js"]