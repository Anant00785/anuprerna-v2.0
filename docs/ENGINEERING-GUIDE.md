# Anuprerna Engineering Guide

The team handbook for the `anuprerna-v2.0` monorepo. Read this once end-to-end before your first
PR. It explains **what the repo is, how it is laid out, which industry standards we follow and
why, and the rules everyone follows.** Keep it open while you work.

> TL;DR — One repo, four deployable apps, three shared packages. Types are the contract, tests live
> next to code, docs drive the work. We are migrating off a vendor-locked stack without a big-bang
> rewrite. Do not fight these conventions; they are the plan.

---

## 1. Why this repo exists

Anuprerna (handloom / artisan-textile commerce) is moving off a **vendor-owned proprietary stack**
(Java "Loom" backend, Angular "Weave" admin, Angular "Fabric" storefront) onto a **self-owned
stack** we fully control. We do this with a **strangler-fig migration**: stand up a new backend that
proxies the old one, then replace it route-by-route until the old system is dead. No flag day, no
rewrite-and-pray.

This monorepo **consolidates the three previously-separate rebuild repos** (backend, cms, storefront)
into one, so shared types stop drifting and the 364 untyped cross-boundary reads the audit found get
closed in one place.

---

## 2. Tech stack (and why each)

| Layer | Choice | Why (industry rationale) |
|---|---|---|
| Monorepo | **Turborepo + pnpm workspaces** | One source of truth, shared code without publishing, cached task graph. Standard for multi-app TS products. |
| Backend | **NestJS** (Node, TS) | Opinionated modules/DI → testable, scalable, familiar to hire for. Replaces Java Loom. |
| Frontend | **Next.js 15 (App Router) + React 19** | Server Components, ISR/CDN, first-class Vercel deploy. The modern React standard. |
| Types | **Zod + generated OpenAPI client** | Runtime validation *and* static types from one schema. Kills `any` at boundaries. |
| Styling | **Tailwind CSS** | Utility-first, no dead CSS, shared design tokens. |
| Client state | **Zustand** | Minimal hook-based store, no provider boilerplate. Server state stays server-side. |
| Tests | **Vitest + Testing Library** | Fast, ESM-native, same API as Jest. |
| DB | **Managed Postgres** (RDS/Neon/Supabase) | Real FKs, `pg_dump`-portable, no paradigm lock-in. Chosen over self-hosted Convex & raw AWS (see `adr/0003`). |
| Object storage | **S3 / Cloudflare R2** | Standard S3 API, low lock-in. Holds product & artisan images. |
| Hosting | **Vercel** (storefront, cms) · **container** (api, worker) | Managed where leaving is cheap; owned where it is not. |
| Observability | **pino + request-id, Sentry, PostHog, uptime** | From week 1, not bolted on later. |

---

## 3. Repository structure

```
anuprerna/                         # Turborepo + pnpm workspaces
├── apps/                          # independently DEPLOYABLE applications
│   ├── api/                       # NestJS backend  (replaces "Loom")           → container
│   │   └── src/
│   │       ├── identity/          # auth, sessions, dual-accept tokens, resolver
│   │       ├── commerce/          # catalog, cart, checkout, orders, customers, payments
│   │       ├── workflow/          # ArtisanFlow — /af/* routes, af_ tables (extraction seam)
│   │       ├── migration/         # extract → land → profile → model → reconcile
│   │       ├── proxy/             # strangler catch-all: proxy old reads, block writes (SHRINKS)
│   │       └── common/            # pino logger, request-id, guards, filters, health
│   ├── storefront/                # Next.js public site ("Fabric")               → Vercel
│   ├── cms/                       # Next.js admin ("Weave"), own auth boundary    → Vercel
│   └── worker/                    # background jobs: email, Zoho sync, webhooks   → container
├── packages/                      # SHARED, not deployed on their own
│   ├── types/                     # Zod schemas + OpenAPI client (THE contract)
│   ├── ui/                        # shared React components (the design system)
│   └── config/                    # shared tsconfig / eslint / CI rules
├── docs/                          # the durable brief — agents & humans read first
│   ├── adr/                       # Architecture Decision Records (why we chose X)
│   ├── features/                  # one executable spec per feature
│   └── runbooks/                  # cutover, rollback, incident
├── tests/                         # CROSS-APP contract & e2e only (units are co-located)
├── CLAUDE.md                      # root agent/dev brief + invariants
├── turbo.json  pnpm-workspace.yaml  tsconfig.base.json
```

**"One repo does not mean one deployable."** `api` and `worker` ship as containers; `storefront` and
`cms` ship to Vercel. They just share code and one CI.

### Folder-by-folder

- **`apps/api/src/<module>/`** — each module owns a domain: its controllers, services, DTOs, guards,
  and **co-located `*.spec.ts` tests**. `proxy/` is special: it is the catch-all registered *last*
  that forwards not-yet-migrated reads to legacy Loom and returns 501 on writes. **It only ever
  shrinks** — every feature you build removes a route from it.
- **`apps/storefront` / `apps/cms`** — Next.js App Router. Code in `src/app` (routes),
  `src/components` (local), `src/lib` (typed API client + utils), `src/env.ts` (validated env). CMS
  additionally has `src/middleware.ts` guarding its auth boundary.
- **`packages/types`** — every piece of data crossing an API boundary has a Zod schema here. This is
  the single source of truth that both backend and frontends import.
- **`packages/ui`** — shared components. Do not fork the design system per app.
- **`packages/config`** — lint/tsconfig/CI defined once, extended everywhere.
- **`docs/`** — see §7. This is how work is specified and handed off.

---

## 4. Industry standards we follow — and the reason for each

1. **Monorepo with workspaces.** Shared types/UI without version hell; atomic cross-app changes in
   one PR; one CI. *Why:* the audit's 364 untyped reads existed because three repos each re-derived
   types. One repo fixes that structurally.
2. **Types as the contract (Zod + OpenAPI).** A schema gives us runtime validation *and* the static
   type. *Why:* boundaries are where bugs hide; `any` at a `fetch` is how bad data reaches the UI.
   Rule: **no raw `fetch().json()`** — always `apiGet(path, Schema)`.
3. **Tests co-located with code (`*.spec.ts` / `*.test.tsx`).** *Why:* during a strangler migration
   code moves constantly; tests that live next to their code move with it and never rot. A mirrored
   top-level `tests/` tree drifts on the first refactor. `tests/` is reserved for cross-app e2e.
4. **Test-Driven Development.** Write the failing test from the acceptance criterion first. *Why:* it
   forces you to define "done" before coding and gives regression cover for free. **No feature merges
   without tests.**
5. **Server Components by default (Next App Router).** Fetch on the server, ship less JS, keep secrets
   server-side. `"use client"` only when you need interactivity. *Why:* performance and security by
   default.
6. **Validated environment (`src/env.ts`, Zod).** Fail fast at boot on a missing/invalid var. *Why:*
   a typo in an env var should crash startup, not surface as a 3am incident. Never read `process.env`
   directly.
7. **Architecture Decision Records (`docs/adr`).** Every non-obvious choice is written down with its
   context and trade-offs. *Why:* six months later nobody remembers *why*; ADRs stop re-litigation.
8. **Executable feature specs (`docs/features`).** One spec per feature with acceptance criteria, data
   contracts, files-to-touch, and a done-checklist. *Why:* a spec a human or an agent can execute
   without a meeting.
9. **Observability from week 1.** Structured logs (pino) + a request-id traceable across
   storefront → api → worker, plus Sentry and uptime checks. *Why:* you cannot fix what you cannot
   see; retrofitting it after an outage is too late.
10. **Strangler-fig migration.** Wrap the legacy system, replace incrementally, never big-bang.
    *Why:* a full rewrite of a live revenue system is the highest-risk move in software. The `proxy/`
    shrinking to zero *is* the migration progress bar.
11. **Shared config, enforced once (`packages/config`).** One lint/tsconfig/CI ruleset. *Why:*
    consistency without per-app drift or copy-paste.
12. **Conventional Commits + trunk-based PRs.** Small PRs, clear history, easy revert. (See §6.)

---

## 5. How we build a feature (the workflow everyone follows)

```
1. SPEC      Create docs/features/<name>.md from _TEMPLATE.md.
             Acceptance criteria must be unambiguous. No spec → no code.
2. PLAN      One task per acceptance criterion. Read the target app's CLAUDE.md.
3. TYPES     Add/extend the Zod schema in packages/types for any new data contract.
4. TDD       Write the co-located test (*.spec.ts / *.test.tsx) from the criteria — watch it fail.
5. BUILD     Implement the smallest code that makes the tests pass.
6. MIGRATION If this converted a legacy read, REMOVE that route from proxy/.
7. GREEN     pnpm lint typecheck test — all green for touched packages.
8. PR        Small, focused, conventional-commit title. Link the spec.
9. HANDOFF   Append to the spec's "Handoff log": what changed, what's verified, next step.
```

**Definition of Done** (also in `docs/AGENT-HANDOFF.md`): all acceptance criteria tested & green;
types updated; lint+typecheck+test pass; a `proxy/` route removed if a legacy read was converted;
spec's done-checklist ticked; handoff note written.

---

## 6. Coding conventions

- **Language:** TypeScript everywhere, `strict` on. **No `any`** at boundaries — use a schema.
- **Imports:** use workspace aliases `@anuprerna/types`, `@anuprerna/ui`, and `@/…` inside an app.
- **Data fetching (frontend):** only via `src/lib/api.ts` + a Zod schema. Never raw `fetch().json()`.
- **Env:** import from `src/env.ts`; never touch `process.env` directly.
- **React:** Server Components by default; `"use client"` only for interactivity; secrets stay server-side.
- **Naming:** files `kebab-case.ts`; classes `PascalCase`; a NestJS module folder owns one domain.
- **Commits:** Conventional Commits — `feat(commerce): add cart merge`, `fix(identity): reject expired token`.
- **Branches/PRs:** short-lived branches off `main`; small PRs; squash-merge; link the feature spec.
- **Comments are a lagging indicator — trust the code.** If a comment and the code disagree, fix both.

---

## 7. Documentation model (`docs/`)

| Folder | What | When you touch it |
|---|---|---|
| `adr/` | Architecture Decision Records | Whenever you make a non-obvious, hard-to-reverse choice. Use `_TEMPLATE.md`. |
| `features/` | Executable feature specs | Before building any feature. Use `_TEMPLATE.md`. |
| `runbooks/` | Operational procedures | Cutover, rollback, incident. Update after every real incident. |
| `AGENT-HANDOFF.md` | The pick-up/hand-off protocol | Read before starting; append after finishing. |
| `frontend-conventions.md` | Shared Next.js rules | Before frontend work. |

Docs are **checked in and reviewed like code**. A feature without a spec, or a decision without an
ADR, is incomplete work.

---

## 8. The migration model (do not violate)

- **`proxy/` only shrinks.** It is the list of everything not yet migrated. Every feature moves a
  route *out* of it into a real module. Never add a route *to* proxy.
- **Auth is dual-accept during migration.** The API accepts BOTH a legacy Loom token AND a new native
  token, so we can cut over without a flag day. Do not break legacy tokens until the cutover runbook
  says so.
- **Never persist decrypted email.** Legacy stores email encrypted at rest; decrypt only at the API
  boundary, never write plaintext back.
- **Migration pipeline** (`apps/api/src/migration`) runs extract → land → profile → model → reconcile.
  A working prototype (crawler + loader + compare) lives in `../loom-local-db`; read its
  `ANUPRERNA-DB-CLONE-MASTER-REPORT.md` for the real data caveats (passwords not exportable, emails
  encrypted, synthetic gaps) that shape cutover.

---

## 9. Deployment & environments

| App | Runs on | Notes |
|---|---|---|
| storefront | Vercel | public, CDN, ISR. Lock-in: low (it is just Next.js). |
| cms | Vercel | own auth boundary, SSO. |
| api | container (Fly/Railway/Render/ECS) | long-lived; scales horizontally. |
| worker | container | off the request path; the API never blocks on it. |
| Postgres | managed (RDS/Neon/Supabase) | system of record; `pg_dump`-portable. |
| storage | S3 / R2 | images & assets. |

Each app has its own build/deploy; Turborepo only rebuilds what changed.

---

## 10. Observability (wired from day 1)

- **Structured logs (pino) + request-id** — one id flows storefront → api → worker, so you can trace
  a single user action end-to-end.
- **Sentry** — errors and traces.
- **PostHog** — product analytics / conversion funnels.
- **Uptime + health checks** — `GET /health` on the api; alerts catch silent degradation.
- **Passthrough fallback rate** — a custom metric for how much traffic still hits the proxy (the
  migration's live progress number).

---

## 11. Agent-assisted development

This repo is built so **Claude (or any coding agent) can extend it with minimal human intervention.**

- **`CLAUDE.md` hierarchy:** root brief → each app's `CLAUDE.md` → the feature spec. An agent reads
  top-down before writing code.
- **Executable specs + handoff log** let an agent pick up, complete, and hand off a unit of work with
  full context — no tribal knowledge required.
- **Invariants** (proxy shrinks, dual-accept auth, no plaintext email, no real outbound creds outside
  a sandbox) are stated once at the root and enforced in review.
- Humans review the same artifacts agents do — the workflow is identical whether a person or an agent
  does the work.

---

## 12. New-developer onboarding checklist

- [ ] Read this guide end-to-end.
- [ ] Read root `CLAUDE.md`, then the `CLAUDE.md` of the app you'll work in.
- [ ] `pnpm install` at the root; `pnpm dev` (or `pnpm --filter <app> dev`).
- [ ] Run `pnpm test` and `pnpm typecheck` — see them green.
- [ ] Read one ADR and one feature spec to learn the shape.
- [ ] Skim the DB clone report in `../loom-local-db` to understand the data you'll migrate.
- [ ] Pick a spec from `docs/features/`, make a task per acceptance criterion, and follow §5.

---

## Glossary

- **Loom / Weave / Fabric / Weft** — legacy vendor stack: backend / admin / storefront / mobile
  (weaving metaphor). We are replacing Loom→api, Weave→cms, Fabric→storefront. Weft (Flutter mobile)
  is out of scope for now.
- **ArtisanFlow (`/af/*`, `af_` tables)** — a net-new tenant-scoped workflow module, built clean as
  an extraction seam, not a port of anything legacy.
- **Strangler-fig** — the migration pattern: wrap the old system, replace it incrementally until it
  can be deleted.
- **Dual-accept** — the API accepting both legacy and native auth tokens during the transition.
- **Proxy / write-guard** — the catch-all that forwards unconverted reads and blocks writes; shrinks
  to zero as migration completes.
