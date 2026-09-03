# LOOM API Migration Completion Report — WITHDRAWN

**Original date:** August 13, 2026
**Withdrawn:** 2026-09-02

This document asserted that the Java LOOM → NestJS migration "has been
completed", with 54/54 modules wired and 100% real database integration. That is
not what the code does.

Measured on 2026-09-02 by `scripts/route-coverage.mjs`:

- 694 legacy routes (this report said 686 — close, and the only number here that held up).
- 619 matched on the new side, **but 36 of those match only a controller that no
  module registers**, so they are never routed.
- 75 legacy routes have no counterpart at all.
- **Effective gap: 111 routes (16.0%).**
- 15 controllers are declared and absent from every module's `controllers[]`.
- At least one live storefront integration is broken by a path rename
  (`/get/forex-list`, `/get/forex-exchange-rate/latest`).

The "351 Swagger endpoints" and "100% real database" claims in the original text
were never re-verified and are not supported by any measurement in the repo; they
should not be cited.

**Read instead:** [`docs/migration-route-coverage.md`](../migration-route-coverage.md)
— same numbers, produced by a re-runnable script, with the full missing-route
list and per-family frontend-caller evidence.
