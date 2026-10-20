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

## Progressive Credential Loading & Production Architecture (v0.2.0)

This service implements the **Progressive Credential Loading (PCL)** pattern, decoupling development speed from external infrastructure provisioning:

```mermaid
graph LR
    Env[Environment Credentials] -->|Detect Keys & URLs| Detector[Credential Detector]
    Detector -->|No Credentials / Missing| Mock[Mock Mode Factory]
    Detector -->|Valid Credentials Present| Live[Live Provider Factory]
    Mock --> Runtime[Application Core & /health]
    Live --> Runtime
```

### Core Architecture Components
1. **Mode Detection Singleton:** Inspects environment configuration at boot time without hard crashes on missing secrets.
2. **Dual-Mode Factory Wrappers:**
   - **Storage / Cache:** In-process maps or SQLite `:memory:` transparently promote to managed Redis or PostgreSQL when connection strings are supplied.
   - **AI Providers:** Deterministic heuristic generators and local embeddings transparently promote to live OpenAI, Anthropic, or Gemini API clients.
3. **Hot-Reload & Dynamic TLS:** File watchers monitor mounted volume paths (Kubernetes ConfigMaps and Secrets) to update certificates and limit configs atomically without process restarts.
4. **Health & Observability:** The `/health` endpoint exposes real-time runtime mode metadata (`mock` vs `live`) across all backing adapters.
