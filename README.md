# Delivery App Monorepo

Workspaces:
- admin: React admin panel
- backend: Node.js APIs and Lambdas
- packages/shared: shared types and utils

Conventions:
- Tenant resolution via X-Tenant-ID
- JWT auth (RS256), roles/permissions
- PostgreSQL with shared tenant_id