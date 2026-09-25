# Local Deployment Setup

This document outlines the local offline deployment workflow for ResilienceOS, utilizing Docker Compose to orchestrate the backend, frontend, and PostgreSQL dependencies without relying on cloud-only infrastructure.

## Prerequisites
- **Docker & Docker Compose**: Required for container orchestration.
- **Python 3.10+**: Required if running the backend natively outside Docker.
- **Node.js 18+**: Required if running the Vite frontend natively.

## Environment Setup
Before starting the application, initialize your local environment variables by copying the template file:
```bash
cp .env.example .env
```
The `.env` file explicitly controls the database credentials. Ensure the following variables are set:
- `POSTGRES_USER` (Default: `resilience`)
- `POSTGRES_PASSWORD` (Replace with a local password)
- `POSTGRES_DB` (Default: `resilienceos`)
No real production secrets should be committed or hardcoded.

## Docker Compose
The `docker-compose.yml` orchestrates the local stack:
- **PostgreSQL Container**: Boots a `postgres:15` instance bound to port `5432`.
- **Persistent Volume**: Database data is persisted locally via the `postgres_data` Docker volume.
- **Database Healthcheck**: Actively verifies readiness using `pg_isready` before releasing dependent services.
- **Backend Depends_On**: The `resilienceos-backend` container waits for the database `service_healthy` condition before booting.
- **Environment-based DB Configuration**: The backend dynamically mounts its `DATABASE_URL` using the credentials declared in `.env` (`postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}`).

## Startup
To boot the full stack using Docker Compose:
```bash
docker-compose up -d --build
```
Alternatively, developers can use the local `start.bat` script on Windows to run the services natively outside of Docker.

*(Note: The repository currently does not execute Alembic migrations automatically inside the Dockerfile. If database schema migrations are required, they must be executed manually via Alembic against the running PostgreSQL instance).*

## Frontend
The Vite frontend runs in a separate container (`resilienceos-frontend`) and connects to the backend API. Local development communication is typically routed via Vite's proxy configuration or explicit `localhost:8000` fetches.

## WebSockets
Local WebSocket connections are available natively at:
- `ws://localhost:8000/ws/telemetry`
- `ws://localhost:8000/ws/twin`

## Verification
- **Static Configuration Verification**: The docker-compose network topologies, volume mappings, and asynchronous PostgreSQL dialects have been statically validated.
- **Runtime Verification**: Runtime Docker deployment verification is currently unavailable in the testing sandbox. Do not assume the Docker stack boots flawlessly without manual validation on a host machine.

## Troubleshooting
- **PostgreSQL Health/Startup**: If the backend container fails to start, verify that the `resilienceos-postgres` container successfully passed its `pg_isready` healthcheck.
- **Environment Variables**: Ensure `.env` is properly formatted and positioned in the root directory.
- **Migration Problems**: If tables are missing, ensure Alembic migrations were successfully applied to the PostgreSQL instance.
- **Frontend/Backend Connection**: Verify CORS configurations in the backend if the frontend fails to fetch `http://localhost:8000/api/hospital/state`.
