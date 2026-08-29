# Changelog

All notable changes to the `multi-tenant-auth-rbac` project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-08-30

### Added/Fixed (Phase 6 Functional Upgrades)
- Added `rls-integration-test` to the CI pipeline to execute end-to-end Row-Level Security (RLS) isolation checks on PostgreSQL.
- Added automated capture and artifact upload of PostgreSQL `EXPLAIN ANALYZE` output proving the RLS policy is enforced in query plans.
- Added GitHub Actions CI status badge.
