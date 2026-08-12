# ADR 0001: Monorepo on Turborepo + pnpm

- **Status:** accepted
- **Date:** 2026-07-23

## Context
Three separate rebuild repos (backend, cms, storefront) drift apart; shared types are copy-pasted;
the audit found 364 untyped cross-boundary reads.

## Decision
One repo, independently deployable apps (`apps/*`) + shared `packages/*`. Turborepo for task
graph/caching, pnpm workspaces for linking. One repo does NOT mean one deployable.

## Consequences
- Shared `@anuprerna/types` closes the untyped reads in one place.
- api + worker deploy as containers; storefront + cms to Vercel — unchanged by co-location.
- CI/lint/tsconfig enforced once in `packages/config`.

## Status update (2026-08-12)

The monorepo structure itself is real and working: `pnpm lint`/`typecheck`/`test`/`build` run via
Turborepo across all five workspaces and are green (see `docs/AGENT-FRAMEWORK.md` §4), and CI
(`.github/workflows/ci.yml`) now runs them on every push/PR — that part of the decision paid off.

Two of the stated consequences have not materialized yet, though:

- **`@anuprerna/types` does not yet close the untyped reads.** It contains exactly one hand-written
  schema (`customer.schema.ts`), which nothing in either frontend imports. The 364 untyped
  cross-boundary reads this ADR set out to fix are still untyped — see `docs/DATA-FLOW.md` and
  `docs/KNOWN-GAPS.md`.
- **`packages/config` is not enforced once.** It exists but has zero consumers; `apps/api`'s
  `eslint.config.mjs` hand-mirrors `packages/config/eslint.base.mjs` in a comment instead of
  importing it, and every workspace still hand-rolls its own lint/tsconfig. See
  `docs/KNOWN-GAPS.md`.

The co-location and CI-graph benefits held; the shared-code-actually-shared benefit is still
aspirational. Re-check this note once `packages/types` and `packages/config` gain real consumers.
