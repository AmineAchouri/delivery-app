# Testing stack

- Postgres 16 on port 5432
- Optional pgAdmin on http://localhost:8081

Commands:
- Start: docker compose -f testing/docker-compose.yml up -d
- Stop: docker compose -f testing/docker-compose.yml down

Backend .env:
DATABASE_URL=postgresql://postgres:yourPassword@localhost:5432/delivery_app?schema=public