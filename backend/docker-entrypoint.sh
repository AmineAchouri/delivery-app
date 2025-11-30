#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema ./prisma/schema.prisma

echo "Seeding platform admin..."
npx ts-node prisma/seedPlatformAdmin.ts || echo "Platform admin already exists or seed failed"

# Seed demo data only in test/dev environments
if [ "$DEPLOY_ENV" = "test" ] || [ "$DEPLOY_ENV" = "dev" ]; then
  echo "Seeding demo data for $DEPLOY_ENV environment..."
  npx ts-node prisma/seed-demo.ts || echo "Demo data seeding failed or already exists"
else
  echo "Skipping demo data seeding in $DEPLOY_ENV environment"
fi

echo "Starting application..."
exec node dist/server.js
