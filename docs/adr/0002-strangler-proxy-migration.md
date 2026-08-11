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

## Status update (2026-08-12)

This decision has not been executed yet. `apps/api/src/proxy/proxy.module.ts` is a one-file empty
`@Module({})` — no route has ever been forwarded through it, no write has ever been 501'd by it,
and it has neither grown nor shrunk since it was created. `apps/api/src/migration` is the same:
an empty shell, with the real working prototype living entirely in `../../loom-local-db` outside
this repo, not ported in.

**The actual strangler boundary today is not `proxy/` at all.** Both frontends talk to the legacy
Java backend directly through their own `/api/backend/[...path]` route handlers
(`apps/storefront/src/app/api/backend/[...path]/route.ts`,
`apps/cms/src/app/api/backend/[...path]/route.ts`), which spoof `Origin`/`Referer` to satisfy the
legacy backend's CORS filter and forward everything through. `apps/api` — the intended replacement
— compiles and has real business logic in `commerce/` and `auth/`, but carries **zero production
traffic**: nothing in either frontend points at it. See `docs/ARCHITECTURE.md` §2–3 and
`docs/DATA-FLOW.md` for the verified, file-by-file picture.

The decision recorded above (a catch-all proxy module that shrinks to zero) remains the intended
design and has not been reversed — it just hasn't been built. Root `CLAUDE.md` and
`docs/ENGINEERING-GUIDE.md` state this status plainly rather than describing the unbuilt mechanism
as active. Re-check this note once any route actually transits `proxy/`.
