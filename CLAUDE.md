# CLAUDE.md — anuprerna (root agent brief)

Self-owned rebuild of the Anuprerna handloom commerce platform. Strangler-fig migration off the
vendor-locked Loom/Weave/Fabric stack. **This repo is built to be extended by agents with minimal
human intervention — follow this brief exactly.**

## How to work here
1. **Read before coding:** this file → the target app's `CLAUDE.md` → the feature spec in `docs/features/`.
2. **One feature = one spec** (`docs/features/_TEMPLATE.md`) with acceptance criteria. Make a todo per criterion.
3. **TDD:** co-located `*.spec.ts` first, then implement. No feature merges without tests.
4. **Types are the contract:** anything crossing the API boundary gets a Zod schema in `@anuprerna/types`.
5. **Handoff:** on completion, append to the spec's `## Handoff log` (see `docs/AGENT-HANDOFF.md`).

## Invariants (do not violate)
- **The strangler boundary must only shrink toward `apps/api`.** `apps/api/src/proxy` is the
  intended landing zone for this, but as of `chore/agent-substrate` it is an empty `@Module({})`
  shell — nothing has ever been proxied through it and 0% of traffic transits it. Today the real
  boundary is the two frontends' `/api/backend/[...path]` route handlers
  (`apps/storefront/src/app/api/backend/[...path]/route.ts`,
  `apps/cms/src/app/api/backend/[...path]/route.ts`), which talk to the legacy backend directly.
  Do not widen `proxy/` with dead scaffolding to satisfy this invariant on paper — either route
  real traffic through it as features cut over, or treat the frontend proxy routes as the
  boundary until it is populated. See `docs/adr/0002-strangler-proxy-migration.md` (status
  update) and `docs/ARCHITECTURE.md` §3.
- Auth is **dual-accept** until the cutover runbook says otherwise; don't break legacy Loom tokens.
  > **Status:** not yet implemented — `identity/` is an empty shell; see
  > `docs/features/0001-identity-dual-accept-auth.md` (NOT STARTED).
- Never persist decrypted email; decrypt only at the boundary.
- Never point outbound email/SMS/payments at real creds outside a sandbox.

## Structure
`apps/{api,storefront,cms,worker}` · `packages/{types,ui,config}` · `docs/{adr,features,runbooks}` · `tests/`
Each app's `CLAUDE.md` is the local source of truth. `docs/README.md` explains the work loop.

## Observability
> **Status:** target state, not current reality. `apps/api/src/common/middleware/request-id.middleware.ts`
> exists but is never registered in `app.module.ts` — no request ID is attached to any real
> request. There is no Sentry or PostHog integration anywhere in the code, and no uptime/health
> alerting beyond the bare `GET /health` endpoint. Wire pino structured logs + request-id, Sentry,
> and PostHog in `apps/api/src/common` as the work is picked up; see `docs/KNOWN-GAPS.md`.

## Documentation is part of the change, not a follow-up

`docs/generated/` is produced from the code by `scripts/gen-docs/index.mjs` — routes,
endpoints, the test catalogue, the schema, and the state inventory. **Never edit those files
by hand.** Run `pnpm docs:gen` and commit the result; CI runs `pnpm docs:check` and fails when
they are stale.

A `PostToolUse` hook (`.claude/settings.json`) regenerates them automatically whenever you edit
anything under `apps/` or `packages/`, and tells you when a change has likely invalidated a
hand-written document. Generated docs cannot write prose, so that part is on you:

- Changed behaviour a document describes? Update that document in the same change.
- Found a gap, or knowingly left one? It goes in `docs/KNOWN-GAPS.md`, which is the authoritative
  ledger and is expected to be blunt.
- Do not describe intent as if it were reality. This repository shipped 45,000 lines against docs
  that confidently described a fetch path with zero importers and a CMS auth middleware that never
  existed. Mark unbuilt things unbuilt.
