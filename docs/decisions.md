# Decisions

## ADR-001: PostgreSQL Row-Level Security for Isolation
**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
Application-side filtering (e.g. `WHERE tenant_id = ?`) is prone to developer error and can result in catastrophic cross-tenant data leaks.

**Decision:**  
We enforce data isolation using PostgreSQL Row-Level Security (RLS). The API layer sets a session variable (`SET LOCAL current_tenant_id = '...'`) before executing queries.

**Consequences:**  
- ✅ Bulletproof isolation at the database layer.
- ⚠️ Requires connection pooling configurations that support session state properly (e.g. pgBouncer in session mode, not transaction mode, or careful connection checkout logic).
