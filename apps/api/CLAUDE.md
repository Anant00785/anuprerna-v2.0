# CLAUDE.md — apps/api (loom replacement, NestJS)

Long-lived container. Replaces the vendor-locked Java Loom via strangler-fig.

## Module map

Verified against the code on `chore/agent-substrate`, 2026-08-12 — see `docs/MODULE-MAP.md` for
the full, per-subdomain breakdown. Four of the nine top-level modules are still single-file empty
`@Module({})` shells; do not assume a module directory existing means it is implemented.

| module | owns | state |
|---|---|---|
| `database/` | Drizzle ORM client (`DATABASE_CONNECTION` provider, global). Schema in `database/schema/` is introspected from the running Postgres via `pnpm db:introspect` — don't hand-edit, re-run introspect after schema changes. | **Real.** |
| `auth/` | Password auth (`GatekeeperService`): **`bcrypt(pepper + password)` at cost 11** via `bcryptjs`, matching the legacy `NVersePasswordEncoder`. Tokens signed with `jose`. Tenant lookup, `RolesGuard`. Auth0/social login still bound to a dummy that always rejects — the 3,390 GOOGLE accounts have no working path yet. | **Real.** This is where auth actually lives today, not `identity/`. Verified against production hashes: all 7,254 are `$2a$11$`/60 chars. |
| `commerce/` | 55 subdomains: catalog, cart, checkout, orders (4 types), customers, payments, ArtisanFlow (`artisan/`, `workflow/`, `skill/`), and more — see `docs/MODULE-MAP.md` §2. | **Real** — the bulk of the backend. |
| `identity/` | Documented to own auth/sessions/dual-accept tokens/delegated resolver. | **Empty shell** — `@Module({})`. The functionality is in `auth/` instead. |
| `workflow/` | Documented to own ArtisanFlow. Its own header comment claims `/af/*` routes and `af_`-prefixed tables. | **Empty shell, and the comment is wrong.** No `af_` tables exist anywhere in the schema and no `/af/*` routes are registered here. Real ArtisanFlow lives in `commerce/artisan`, `commerce/workflow`, `commerce/skill` — unprefixed tables (`workflow`, `artisan`, `step_element`, `subprocess_element`, `catalog_item`). |
| `migration/` | extract/land/profile/model/reconcile (prototype lives in `../../loom-local-db`) | **Empty shell** — nothing implemented in `apps/api` itself. |
| `proxy/` | Intended strangler catch-all: forward unconverted reads to Loom, 501 writes. Meant to be registered LAST and shrink to zero. | **Empty shell.** Nothing has ever been routed through it; 0% of traffic transits it. The real strangler boundary today is the frontends' `/api/backend/[...path]` route handlers — see root `CLAUDE.md` and `docs/adr/0002-strangler-proxy-migration.md` (status update). |
| `common/` | Shared cross-cutting code: request-id middleware, `RolesGuard`, error codes, response envelope, `health/`. | **Partially real.** `request-id.middleware.ts` exists and has a passing spec but is never registered in `app.module.ts` — no real request gets a request-id. `common/logger/` has only a README, no pino logger code yet. |

## Rules for working here
1. **Never widen the strangler boundary.** `proxy/` is the intended landing zone for this and must
   only shrink once populated, but it is currently empty — until it holds real routes, do not add
   scaffolding to it just to satisfy this rule on paper. If you convert a legacy read, remove the
   corresponding call from the frontend `/api/backend` bypass instead, and note it in your handoff.
2. **Types first.** Any data crossing the API boundary gets a Zod schema in `@anuprerna/types`
   (aspirational today — see `docs/KNOWN-GAPS.md`; `packages/types` has one unused schema).
3. **Test co-located.** Each service/controller ships a `*.spec.ts` beside it. No feature merges without tests.
   Baseline today: 2 spec files across 573 source files — see `docs/TESTING.md`.
4. **Auth is dual-accept during migration** — do not break legacy Loom tokens until cutover (see
   `docs/runbooks/cutover.md`). Not yet built: see `docs/features/0001-identity-dual-accept-auth.md`
   (status: NOT STARTED).
5. Decrypt email only at the boundary; never persist plaintext (see `docs/adr/0003-*`). Note
   `EMAIL_ENCODER_PORT` is currently bound to a dummy in `commerce/cart/cart.module.ts` — the
   decrypt path is not wired yet either (see `docs/MODULE-MAP.md` §4).

## Before building a feature
Read its spec in `docs/features/<feature>.md`, create a todo per acceptance criterion, follow TDD.
