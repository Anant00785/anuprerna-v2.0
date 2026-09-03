# LOOM API Migration & Swagger Gap Report — WITHDRAWN

**Original date:** August 13, 2026
**Withdrawn:** 2026-09-02

This document's "Post-Migration Audit" column (54/54 modules wired, 351 Swagger
endpoints, 100% real database integration) described intent, not the code. Its
per-module "Active" claims are unreliable: several of the controllers it lists as
active — `SkuGroupController`, `SpecialStatusController`, `BadgeProfileController`,
`ProfileController`, `ContentController`, `CatalogController` — are not
registered in any NestJS module and therefore serve nothing.

Its one durable number is the legacy endpoint census: 686, against 694 measured.

Swagger exposure was **not** re-measured for this correction — checking it needs a
running server, and no static measurement in this repo supports the 351 figure.
Treat Swagger coverage as **unknown/unmeasured** until someone exports
`/docs-json` (`pnpm swagger:export`) and records the result.

**Read instead:** [`docs/migration-route-coverage.md`](../migration-route-coverage.md)
— measured route coverage from `scripts/route-coverage.mjs`, including the 15
declared-but-unregistered controllers this report counted as active.
