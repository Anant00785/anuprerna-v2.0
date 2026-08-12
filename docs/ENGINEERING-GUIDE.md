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
| Types | **Zod** (generated OpenAPI client is a target, not built) | Runtime validation *and* static types from one schema. Kills `any` at boundaries. > **Status:** `packages/types` has exactly one hand-written schema (`customer.schema.ts`), which nothing imports yet, and no client generator exists. See `docs/DATA-FLOW.md` and `docs/KNOWN-GAPS.md`. |
| Styling | **Tailwind CSS** | Utility-first, no dead CSS, shared design tokens. |
| Client state | **Zustand** | Minimal hook-based store, no provider boilerplate. Server state stays server-side. |
| Tests | **Vitest + Testing Library** | Fast, ESM-native, same API as Jest. |
| DB | **Managed Postgres** (RDS/Neon/Supabase) | Real FKs, `pg_dump`-portable, no paradigm lock-in. Chosen over self-hosted Convex & raw AWS (see `adr/0003`). |
| Object storage | **S3 / Cloudflare R2** | Standard S3 API, low lock-in. Holds product & artisan images. |
| Hosting | **Vercel** (storefront, cms) · **container** (api, worker) | Managed where leaving is cheap; owned where it is not. |
| Observability | **pino + request-id, Sentry, PostHog, uptime** | Target: from week 1, not bolted on later. > **Status:** not yet wired. `request-id.middleware.ts` exists but is never registered in `app.module.ts`; there is no Sentry or PostHog integration in the code. See §10. |

---

## 3. Repository structure

```
anuprerna/                         # Turborepo + pnpm workspaces
├── apps/                          # independently DEPLOYABLE applications
│   ├── api/                       # NestJS backend  (replaces "Loom")           → container
│   │   └── src/
│   │       ├── auth/              # REAL: password auth (GatekeeperService, scrypt), tenant lookup
│   │       ├── commerce/          # REAL: 55 subdomains — catalog, cart, checkout, orders, customers,
│   │       │                      #   payments, ArtisanFlow (artisan/workflow/skill), and more
│   │       ├── identity/          # EMPTY SHELL — @Module({}); intended to own auth/sessions/
│   │       │                      #   dual-accept, but that logic actually lives in auth/ today
│   │       ├── workflow/          # EMPTY SHELL — @Module({}); the real ArtisanFlow implementation
│   │       │                      #   lives under commerce/artisan, commerce/workflow, commerce/skill
│   │       ├── migration/         # EMPTY SHELL — @Module({}); working prototype is in ../../loom-local-db
│   │       ├── proxy/             # EMPTY SHELL — @Module({}); intended strangler catch-all, not populated
│   │       └── common/            # request-id middleware + roles guard (real, but request-id is not
│   │                              #   registered in app.module.ts); no pino logger code yet
│   ├── storefront/                # Next.js public site ("Fabric")               → Vercel
│   ├── cms/                       # Next.js admin ("Weave"), own auth boundary    → Vercel
│   └── worker/                    # background jobs: email, Zoho sync, webhooks   → container
├── packages/                      # SHARED, not deployed on their own
│   ├── types/                     # Zod schemas (THE contract; generated OpenAPI client not built yet)
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

- **`apps/api/src/<module>/`** — each real module owns a domain: its controllers, services, DTOs,
  guards, and **co-located `*.spec.ts` tests**. As of this branch, `auth/` and `commerce/` (55
  subdomains, 116 controllers) are real; `identity/`, `workflow/`, `migration/`, and `proxy/` are
  still single-file empty `@Module({})` shells — see `docs/MODULE-MAP.md` §1 for the verified
  per-module state. `proxy/` is *intended* as the catch-all, registered last, that forwards
  not-yet-migrated reads to legacy Loom and returns 501 on writes, and is intended to only ever
  shrink as features move out of it — but it has never been populated, so nothing has shrunk or
  grown. See the root `CLAUDE.md` invariant and `docs/adr/0002-strangler-proxy-migration.md`
  (status update) for what the boundary actually is today.
- **`apps/storefront` / `apps/cms`** — Next.js App Router. Code in `src/app` (routes),
  `src/components` (local), `src/lib` (API client + utils — see below for the real fetch path),
  `src/env.ts` (validated env).
  > **Status:** CMS has **no** `src/middleware.ts` and no server-side auth guard of any kind.
  > `find apps/cms -iname middleware.ts` returns nothing. The only auth gate is a client-side,
  > post-mount `useEffect` in `apps/cms/src/context/AuthContext.tsx`, which runs *after* the
  > protected page's own render and data fetches have already executed. See `docs/DATA-FLOW.md`
  > §4 for the full trace and `docs/KNOWN-GAPS.md` for the security implication.
- **`packages/types`** — the intended single source of truth for data crossing an API boundary.
  > **Status:** one hand-written schema (`customer.schema.ts`), zero importers. Not yet the
  > working contract described here — see §2 and `docs/KNOWN-GAPS.md`.
- **`packages/ui`** — intended shared components. Do not fork the design system per app.
  > **Status:** `packages/ui/src/index.ts` is `export {}` — zero components, zero importers.
- **`packages/config`** — intended lint/tsconfig/CI defined once, extended everywhere.
  > **Status:** zero consumers today. `apps/api/eslint.config.mjs` hand-mirrors
  > `packages/config/eslint.base.mjs` instead of importing it; every other workspace similarly
  > hand-rolls its own config. See `docs/KNOWN-GAPS.md`.
- **`docs/`** — see §7. This is how work is specified and handed off.

---

## 4. Industry standards we follow — and the reason for each

1. **Monorepo with workspaces.** Shared types/UI without version hell; atomic cross-app changes in
   one PR; one CI. *Why:* the audit's 364 untyped reads existed because three repos each re-derived
   types. One repo fixes that structurally.
2. **Types as the contract (Zod + OpenAPI) — target state.** A schema gives us runtime validation
   *and* the static type. *Why:* boundaries are where bugs hide; `any` at a `fetch` is how bad data
   reaches the UI. Rule: **no raw `fetch().json()`** — validate through a Zod schema.
   > **Status:** not yet the practice on this branch. `packages/types` has one schema with zero
   > importers; both frontends' real fetch paths cast `response.json()` to a type with no runtime
   > check. See §6 and `docs/DATA-FLOW.md`.
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
9. **Observability from week 1 — the intent.** Structured logs (pino) + a request-id traceable
   across storefront → api → worker, plus Sentry and uptime checks. *Why:* you cannot fix what you
   cannot see; retrofitting it after an outage is too late. **Status:** not wired yet — see §10.
10. **Strangler-fig migration.** Wrap the legacy system, replace incrementally, never big-bang.
    *Why:* a full rewrite of a live revenue system is the highest-risk move in software. The
    intent is that the strangler boundary shrinking to zero *is* the migration progress bar.
    **Status:** `proxy/` itself is an unpopulated empty shell — the boundary that's actually
    shrinking (100% of traffic still legacy) lives in the frontends' proxy route handlers today.
    See §8.
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
6. MIGRATION If this converted a legacy read, REMOVE that route from proxy/ (see §8 status note —
             proxy/ is currently empty, so today this step has nothing to remove).
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
- **Data fetching (frontend) — target: only via a Zod-validated client.**
  > **Status:** `apps/storefront/src/lib/api.ts` is dead code — zero importers, do not use it as a
  > reference. The real storefront fetch path is `src/lib/api/{client,repositories,adapters}.ts`
  > (no Zod validation yet, casts `response.json()`), and ten route handlers under
  > `src/app/api/*` bypass even that and call the legacy backend directly. `apps/cms` funnels
  > through `src/services/*.ts` → `src/lib/api.ts` (axios) → `unwrapResponseData()`, also
  > unvalidated. See `docs/DATA-FLOW.md` for the full, file-by-file trace of both paths — read it
  > before touching frontend data fetching, this summary is not enough on its own.
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

- **The strangler boundary only shrinks toward `apps/api`.** `proxy/` is the intended list of
  everything not yet migrated, and the intent is that every feature moves a route *out* of it into
  a real module, never adds one *to* it.
  > **Status:** `apps/api/src/proxy` is currently an empty `@Module({})` — nothing has ever been
  > proxied through it, so there is nothing to shrink yet. The actual strangler boundary today is
  > the two frontends' `/api/backend/[...path]` route handlers, which call the legacy backend
  > directly. See `docs/adr/0002-strangler-proxy-migration.md` (status update) and
  > `docs/ARCHITECTURE.md` §3 for the real mechanism.
- **Auth is dual-accept during migration.** The API accepts BOTH a legacy Loom token AND a new native
  token, so we can cut over without a flag day. Do not break legacy tokens until the cutover runbook
  says so.
  > **Status:** not yet implemented — see `docs/features/0001-identity-dual-accept-auth.md`
  > (status: NOT STARTED).
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

## 10. Observability (target — not wired yet)

> **Status:** none of this is built today, beyond the bare `GET /health` endpoint. Stated here as
> the intended shape so the gap is unambiguous, not smoothed over. See `docs/KNOWN-GAPS.md`.

- **Structured logs (pino) + request-id** — one id flows storefront → api → worker, so you can trace
  a single user action end-to-end.
  > `apps/api/src/common/middleware/request-id.middleware.ts` exists and has a passing spec, but is
  > never registered in `app.module.ts` — no request in the real pipeline gets an id today. There
  > is no pino logger code (`common/logger/` has only a README).
- **Sentry** — errors and traces. Not integrated anywhere in the code.
- **PostHog** — product analytics / conversion funnels. Not integrated anywhere in the code.
- **Uptime + health checks** — `GET /health` on the api exists and works; no external alerting is
  wired to it.
- **Passthrough fallback rate** — a custom metric for how much traffic still hits the legacy
  backend (the migration's live progress number). Not built; today the honest number is simply
  "100%, both frontends" (see `docs/ARCHITECTURE.md` §2).

---

## 11. Agent-assisted development

This repo is built so **Claude (or any coding agent) can extend it with minimal human intervention.**

- **`CLAUDE.md` hierarchy:** root brief → each app's `CLAUDE.md` → the feature spec. An agent reads
  top-down before writing code.
- **Executable specs + handoff log** let an agent pick up, complete, and hand off a unit of work with
  full context — no tribal knowledge required.
- **Invariants** (strangler boundary shrinks, dual-accept auth, no plaintext email, no real outbound
  creds outside a sandbox) are stated once at the root and enforced in review.
- **Target process, not current practice.** The intent is that humans review the same artifacts
  agents do, so the workflow is identical regardless of who does the work. This was not followed
  on this repo's first pass: five feature PRs merged with zero specs and zero tests before this
  document set existed. `docs/AGENT-FRAMEWORK.md` is the honest accounting of that gap — it
  classifies every rule in this section as **ENFORCED** (a command actually fails) or **ADVISORY**
  (review-only, exactly the condition that let the first five PRs through). Read it before
  assuming a rule stated here is mechanically checked.

---

## 12. New-developer onboarding checklist

- [ ] Read this guide end-to-end.
- [ ] Read root `CLAUDE.md`, then the `CLAUDE.md` of the app you'll work in.
- [ ] `pnpm install` at the root; `pnpm dev` (or `pnpm --filter <app> dev`).
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` — see them all green (as of
      `chore/agent-substrate`: lint 3/3, typecheck 6/6, test 5/5, build 5/5 — see
      `docs/AGENT-FRAMEWORK.md` §4). `pnpm --filter @anuprerna/api test:int` also exists but needs
      a live Postgres reachable at `DATABASE_URL`; it is not part of the default `pnpm test` run.
- [ ] Read one ADR and one feature spec to learn the shape.
- [ ] Skim the DB clone report in `../loom-local-db` to understand the data you'll migrate.
- [ ] Pick a spec from `docs/features/`, make a task per acceptance criterion, and follow §5.

---

## Glossary

- **Loom / Weave / Fabric / Weft** — legacy vendor stack: backend / admin / storefront / mobile
  (weaving metaphor). We are replacing Loom→api, Weave→cms, Fabric→storefront. Weft (Flutter mobile)
  is out of scope for now.
- **ArtisanFlow** — the artisan/workflow domain. Originally intended as a net-new `/af/*`-routed
  module with its own `af_`-prefixed tables (a clean extraction seam, not a port of anything
  legacy); the top-level `workflow/` module documented that intent but was never implemented. In
  practice ArtisanFlow shipped inside `commerce/artisan`, `commerce/workflow`, and `commerce/skill`
  — unprefixed tables (`workflow`, `artisan`, `step_element`, `subprocess_element`,
  `catalog_item`), no `af_` prefix, no `/af/*` route namespace. See `docs/MODULE-MAP.md` §1 and
  `docs/DATA-INVENTORY.md` §5.
- **Strangler-fig** — the migration pattern: wrap the old system, replace it incrementally until it
  can be deleted.
- **Dual-accept** — the API accepting both legacy and native auth tokens during the transition.
- **Proxy / write-guard** — the catch-all that forwards unconverted reads and blocks writes; shrinks
  to zero as migration completes.
