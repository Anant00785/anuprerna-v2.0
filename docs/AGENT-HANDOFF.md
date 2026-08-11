# Agent Handoff Protocol

How work moves through this repo with minimal human intervention.

## Picking up work
1. Read this file, the root `README.md`, and the target app's `CLAUDE.md`.
2. Open the feature spec in `docs/features/<feature>.md`. If none exists, create one from `_TEMPLATE.md` first.
3. Create one todo per **acceptance criterion**. Do not start coding until the spec is unambiguous.

## Doing the work (definition of done)
- [ ] Co-located `*.spec.ts` written first (TDD) and passing.
- [ ] `@anuprerna/types` updated for any new data contract.
- [ ] `pnpm lint typecheck test` green for the touched packages.
- [ ] A route was **removed from `proxy/`** if this converted a legacy read (migration invariant).
      As of `chore/agent-substrate`, `apps/api/src/proxy` is an empty `@Module({})` shell — nothing
      has been routed through it yet, so today this item has nothing to check off. The real
      strangler boundary right now is the frontends' `/api/backend/[...path]` route handlers; note
      any change there in your handoff entry instead. See root `CLAUDE.md` and
      `docs/adr/0002-strangler-proxy-migration.md` (status update).
- [ ] Spec's "Done when" checklist all checked.

## Handing off
Append a dated entry to the feature spec's `## Handoff log`:
- what changed (files/modules), what's verified, what's deliberately deferred, and the exact next step.
Keep it factual — the next agent trusts it without re-deriving.

## Guardrails (never do without a human)
- Don't break legacy Loom token acceptance before the cutover runbook says so.
- Don't enable outbound email/SMS/payments against real creds outside a sandbox.
- Don't widen `proxy/`; the strangler boundary only shrinks toward `apps/api` (see the status note
  above — `proxy/` itself is currently empty, not yet the active boundary).
