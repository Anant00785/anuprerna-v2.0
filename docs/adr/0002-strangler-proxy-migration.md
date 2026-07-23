# ADR 0002: Strangler-fig proxy for the Loom migration

- **Status:** accepted
- **Date:** 2026-07-23

## Context
Legacy Loom (Java, vendor-owned) still serves most reads. A big-bang rewrite is too risky.

## Decision
`apps/api/src/proxy` is a catch-all registered LAST: unconverted reads forward to Loom, writes 501.
Each new native module removes routes from the proxy. Migration invariant: **the proxy only shrinks.**

## Consequences
- Ship incrementally; legacy and new coexist.
- A route's presence in `proxy/` is the migration to-do list.
- `apps/api/src/migration` runs extract/land/profile/model/reconcile (prototype: `../../loom-local-db`).
