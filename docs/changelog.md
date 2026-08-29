# Changelog

## [Unreleased] - 2026-08-30

### Added/Fixed (Phase 6 Functional Upgrades)
- Added `rls-integration-test` to the CI pipeline to execute end-to-end Row-Level Security (RLS) isolation checks on PostgreSQL.
- Added automated capture and artifact upload of PostgreSQL `EXPLAIN ANALYZE` output proving the RLS policy is enforced in query plans.
- Added GitHub Actions CI status badge.

## [2026-08-29] — Phase 2 Evidence
### Added
- Created `tests/e2e/test_rls_postgres.sh` to prove PostgreSQL Row-Level Security isolation.
- Standardized documentation (`runbook.md`, `decisions.md`, `ARCHITECTURE.md`).
- Added maturity badge and mock boundaries to `README.md`.
