# CLAUDE.md — apps/api (loom replacement, NestJS)

Long-lived container. Replaces the vendor-locked Java Loom via strangler-fig.

## Module map
| module | owns |
|---|---|
| `database/` | Drizzle ORM client (`DATABASE_CONNECTION` provider, global). Schema in `database/schema/` is introspected from the running Postgres via `pnpm db:introspect` — don't hand-edit, re-run introspect after schema changes. |
| `identity/` | auth, sessions, **dual-accept tokens** (accept legacy Loom JWT AND new native token during migration), delegated resolver |
| `commerce/` | catalog, cart, checkout, orders (4 types), customers, payments |
| `workflow/` | ArtisanFlow — `/af/*` routes, `af_` tables. Clean extraction seam. |
| `migration/` | extract/land/profile/model/reconcile (prototype lives in `../../loom-local-db`) |
| `proxy/` | strangler catch-all: forward unconverted reads to Loom, 501 writes. Keep registered LAST. Shrinks to zero. |
| `common/` | pino logger, request-id, guards, filters, health |

## Rules for working here
1. **Never widen `proxy/`.** Every new feature moves a route OUT of proxy into a real module.
2. **Types first.** Any data crossing the API boundary gets a Zod schema in `@anuprerna/types`.
3. **Test co-located.** Each service/controller ships a `*.spec.ts` beside it. No feature merges without tests.
4. **Auth is dual-accept during migration** — do not break legacy Loom tokens until cutover (see `docs/runbooks/cutover.md`).
5. Decrypt email only at the boundary; never persist plaintext (see `docs/adr/0003-*`).

## Before building a feature
Read its spec in `docs/features/<feature>.md`, create a todo per acceptance criterion, follow TDD.
