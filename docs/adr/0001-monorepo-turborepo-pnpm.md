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
