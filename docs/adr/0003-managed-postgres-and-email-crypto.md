# ADR 0003: Managed Postgres as system of record; email crypto at the boundary

- **Status:** accepted
- **Date:** 2026-07-23

## Context
Chosen over self-hosted Convex (single-machine, manual migrations) and raw AWS (operational burden).
Legacy stores `email` AES-encrypted at rest; passwords were never exportable from Loom's API.

## Decision
Managed Postgres (RDS/Neon/Supabase) — real FKs, `pg_dump`-portable, no paradigm lock-in.
Decrypt email only at the API boundary; never persist plaintext. Track auth-cutover secrets
(email key, JWT secret, OAuth) as infra config, not DB data.

## Consequences
- Data layer is swappable; business logic doesn't rewrite to change host.
- Cutover must supply the email-decrypt key + a password-reset/seed path (see runbook & the clone report).
