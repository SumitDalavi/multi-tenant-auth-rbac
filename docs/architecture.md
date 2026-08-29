# Architecture — multi-tenant-auth-rbac
> Last updated: 2026-08-29 | Maturity: Partial Prototype
> _Multi-tenant isolation using PostgreSQL RLS._

## System Diagram
```mermaid
flowchart TD
    Client(["API Client\n(JWT: tenant_a)"])
    API["Auth API\n:8080"]
    PG[("Postgres :5432\n(RLS enabled)")]
    
    Client -->|"GET /api/documents"| API
    API -->|"SET LOCAL current_tenant_id = 'tenant_a'"| PG
    API -->|"SELECT * FROM documents"| PG
    PG -->|"Only tenant_a docs returned"| API
    API --> Client
```

## Component Table
| Component | File | Responsibility | Tech |
|---|---|---|---|
| API Server | `src/server.ts` | REST endpoints, JWT validation | Express.js |
| DB Schema | `schema.sql` | RLS definitions and tables | PostgreSQL |

## Dependency Honesty Table
| Dependency | Status | Notes |
|---|---|---|
| PostgreSQL | **Real** | Postgres 16 required to enforce Row-Level Security policies. |
