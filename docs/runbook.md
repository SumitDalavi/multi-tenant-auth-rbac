# Runbook — multi-tenant-auth-rbac
> Last updated: 2026-08-29

## Quick Start
```bash
docker-compose up -d
```
API runs on `http://localhost:8080`.

## Run Tests
```bash
npm test
bash tests/e2e/test_rls_postgres.sh
```

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| POSTGRES_URI | `postgresql://postgres:postgres@localhost:5432/postgres` | DB Connection string |
| JWT_SECRET | `secret` | Symmetric key for verifying user tokens |
