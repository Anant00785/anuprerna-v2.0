# anuprerna-v2.0

Self-owned rebuild of the Anuprerna handloom commerce platform — Turborepo + pnpm monorepo.
Replaces the vendor-locked Loom/Weave/Fabric stack via a strangler-fig migration.

## Layout
- `apps/api` — NestJS backend (identity, commerce, workflow, migration, proxy) — **loom** replacement
- `apps/storefront` — Next.js public storefront (**fabric**), Vercel
- `apps/cms` — Next.js admin (**weave**), Vercel
- `apps/worker` — background jobs (email, Zoho sync, payment webhooks)
- `packages/types` — Zod schemas + generated API client (single source of truth)
- `packages/ui` — shared React components
- `packages/config` — shared tsconfig / eslint / CI rules
- `docs/` — ADRs, executable feature specs, runbooks (**how agents pick up work — read `docs/AGENT-HANDOFF.md`**)
- `tests/` — cross-app contract / e2e (unit tests are co-located as `*.spec.ts`)

## Getting started
```bash
pnpm install
pnpm dev            # all apps
pnpm --filter api dev
pnpm test
```

## Conventions
- Every feature ships with: a spec in `docs/features/`, co-located `*.spec.ts` tests, and an update to `packages/types`.
- Read the nearest `CLAUDE.md` before working in any app — it is the agent + human brief for that surface.

## 📖 New here? Read the [Engineering Guide](docs/ENGINEERING-GUIDE.md)
The full team handbook — structure, industry standards & the reasons behind them, the feature
workflow, testing strategy, conventions, and the onboarding checklist.
