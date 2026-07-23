# docs/

The durable, in-repo brief. **Agents and devs read these before touching code.**

- **`ENGINEERING-GUIDE.md` — the full team handbook. Start here.**
- `AGENT-HANDOFF.md` — how an agent (or dev) picks up and completes a unit of work.
- `adr/` — architecture decision records (why, not just what).
- `features/` — one **executable spec** per feature. `_TEMPLATE.md` is the required shape.
- `runbooks/` — cutover, rollback, incident.

## The loop
1. A feature gets a spec in `features/` (from `_TEMPLATE.md`).
2. An agent reads the spec + the target app's `CLAUDE.md`, makes a todo per acceptance criterion.
3. TDD: write the co-located `*.spec.ts`, then implement, then update `@anuprerna/types`.
4. On completion, append a handoff note (see `AGENT-HANDOFF.md`) so the next agent has context.
