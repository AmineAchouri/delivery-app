#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema ./prisma/schema.prisma

echo "Seeding platform admin..."
npx ts-node prisma/seedPlatformAdmin.ts || echo "Platform admin already exists or seed failed"

echo "Starting application..."
exec node dist/server.js
