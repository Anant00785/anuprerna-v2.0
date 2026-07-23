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
- The `proxy/` module only **shrinks** — every feature moves a route out of it, never in.
- Auth is **dual-accept** until the cutover runbook says otherwise; don't break legacy Loom tokens.
- Never persist decrypted email; decrypt only at the boundary.
- Never point outbound email/SMS/payments at real creds outside a sandbox.

## Structure
`apps/{api,storefront,cms,worker}` · `packages/{types,ui,config}` · `docs/{adr,features,runbooks}` · `tests/`
Each app's `CLAUDE.md` is the local source of truth. `docs/README.md` explains the work loop.

## Observability (from week 1)
pino structured logs + request-id (traceable across all apps), Sentry errors/traces, PostHog analytics,
uptime/health checks. Wire in `apps/api/src/common`.
