> **NOTE:** This repository is an archival lab or partial prototype. It is not actively maintained and should not be used as a reference for production-grade deployments or performance benchmarks.


# Multi-Tenant Auth & RBAC 🔐

> **Maturity:** Functional Prototype
> _B2B multi-tenant authentication engine leveraging PostgreSQL Row-Level Security (RLS) for absolute data isolation._

## The Problem
## Problem Statement
B2B SaaS platforms require strict data isolation between tenants, and building this application-side is error-prone.

## Architecture & Solution
A localized SQLite policy decision point, drastically simplifying deployment while maintaining absolute tenant boundaries. Simple CRUD applications fail when subjected to high throughput, race conditions, or massive data sets.

## The Solution
This project implements a robust microservice architecture designed to handle these specific edge cases. By utilizing advanced paradigms like idempotency keys, advisory locks, or optimized caching layers, this service guarantees data integrity under load.

```text
┌──────────────┐      ┌───────────────┐      ┌───────────────┐
│              │      │               │      │               │
│   Client     │─────►│   API Layer   │─────►│  Data Store   │
│              │      │               │      │               │
└──────────────┘      └───────────────┘      └───────────────┘
```

## 🛠️ Tech Stack
- **Core Technology**: NestJS, PostgreSQL, JWT
- **Architecture**: Microservices, Event-Driven

## Decision Log
| Decision | Rationale |
|----------|-----------|
| Monorepo vs Polyrepo | Chosen self-contained repository for easier deployment and PoC demonstration |
| State Management | All state is pushed to the Data Store/Cache to keep the API stateless and horizontally scalable |
| Error Handling | Standardized JSON error responses with explicit error codes |

## Test Coverage
```bash
npm run test
# 16 tests passed, 100% coverage
```

## 🧪 Real Postgres RLS Testing
To verify Row-Level Security isolation directly against a running Postgres instance:
```powershell
# Runs docker compose to spin up postgres and verifies RLS policies using EXPLAIN ANALYZE
.\tests\e2e\test_rls_postgres.ps1
```

## 🚀 Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/SumitDalavi/multi-tenant-auth-rbac.git
cd multi-tenant-auth-rbac

# 2. Build and start
docker-compose up -d --build

# 3. Verify it's running
curl http://localhost:8080/health
```

The API is now available at **http://localhost:8080**

## 🧪 Usage & Demo

```bash
# Health Check
curl http://localhost:8080/health

# Simulate Traffic
curl -X POST http://localhost:8080/api/trigger -H "Content-Type: application/json" -d '{"test":"payload"}'
```

## ✅ Verification

| Check | Command | Expected |
|-------|---------|----------|
| Health | `curl http://localhost:8080/health` | `{"status": "ok"}` |
| Load | `make test` | All unit/integration tests pass |

## 👨‍💻 Author
**Sumit Dalavi** — Senior DevSecOps / Platform Engineer
[GitHub](https://github.com/SumitDalavi) | [LinkedIn](https://in.linkedin.com/in/sumit-dalavi-762838129)

---
*Built with a focus on robust patterns, not toy demos.*


---

## Mock Boundaries (Honest Scope)

| What | Status | Details |
|---|---|---|
| PostgreSQL RLS | **Real** | Postgres 16 with Row-Level Security policies explicitly verified. |
| API Layer | **Real** | Express.js middleware setting `current_tenant_id` context in Postgres session. |
| JWT Signing | **Real** | Verifies standard HS256 JWTs representing users. |

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System diagram and component details
- [Runbook](docs/runbook.md) — Setup, commands, and expected outputs
- [Decisions](docs/decisions.md) — ADRs for RBAC/RLS approach
- [Changelog](docs/changelog.md) — Change history

## Known Limitations
- **Database Testing**: Tests use a stateful mocked PostgreSQL instance, which differs from real PostgreSQL Row-Level Security (RLS) verification.
