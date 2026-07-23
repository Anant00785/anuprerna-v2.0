# Feature: <name>

> Copy this file to `docs/features/<kebab-name>.md`. This spec is executable by an agent — be precise.

## Context
Why this exists, which legacy behavior it replaces, links to relevant `adr/` and `CLAUDE.md`.

## Scope
- In: ...
- Out (explicitly not now): ...

## Acceptance criteria
1. ...
2. ...
(Each becomes a todo and maps to at least one test.)

## Data contracts
Schemas to add/change in `@anuprerna/types` (Zod). Name them.

## Files to touch
- `apps/api/src/<module>/...`
- `packages/types/src/schemas/...`
- tests: `apps/api/src/<module>/*.spec.ts`

## Test plan
- Unit: ...
- Contract/e2e (only if cross-app): ...

## Done when
- [ ] All acceptance criteria met and tested
- [ ] Types updated
- [ ] lint + typecheck + test green
- [ ] proxy route removed (if a legacy read was converted)

## Handoff log
- <date> — <agent/dev> — <what changed, what's verified, next step>
