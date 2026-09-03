# Anuprerna Platform — Documentation

The durable, in-repo brief for the Anuprerna handloom commerce platform. Everything here is written to
be read by two audiences at once: the engineers on the project, and the AI coding agents that work in
this repository. Both read the same artifacts, and both are held to the same rules.

> **Everything in this folder is verified against the code.** Counts, file paths and behaviours were
> measured, not assumed. Where something could not be verified it is marked as unverified rather than
> guessed. Where a document describes something that does not exist yet, it says so explicitly.

---

## Start here, by question

| If you want to know… | Read |
|---|---|
| What is this system, and how do the pieces fit together? | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| What data exists, and how is it modelled? | [`DATA-INVENTORY.md`](./DATA-INVENTORY.md) |
| How does a request actually flow, end to end? | [`DATA-FLOW.md`](./DATA-FLOW.md) |
| Where does state live, and where is it hiding? | [`STATE-INVENTORY.md`](./STATE-INVENTORY.md) |
| What modules exist and what does each own? | [`MODULE-MAP.md`](./MODULE-MAP.md) |
| What API surface is called, and what is typed? | [`ENDPOINT-INVENTORY.md`](./ENDPOINT-INVENTORY.md) |
| **How do AI agents pick up work, and what are they forbidden from doing?** | [`AGENT-FRAMEWORK.md`](./AGENT-FRAMEWORK.md) |
| How is this tested, and how do I write a test here? | [`TESTING.md`](./TESTING.md) |
| What is not done, and what is known to be wrong? | [`KNOWN-GAPS.md`](./KNOWN-GAPS.md) |
| What does a specific legacy commerce endpoint do? | [`backend/commerce/02-api-documentation.md`](./backend/commerce/02-api-documentation.md) |
| How does the CMS read data, and what happens when the backend fails? | [`frontend/cms/data-layer.md`](./frontend/cms/data-layer.md) |
| How does the CMS authenticate, and which pages write what? | [`frontend/cms/auth-and-writes.md`](./frontend/cms/auth-and-writes.md) |
| Why was a particular decision made? | [`adr/`](./adr) |
| How do I run a cutover, rollback, or incident? | [`runbooks/`](./runbooks) |
| The full team handbook (conventions, standards, rationale) | [`ENGINEERING-GUIDE.md`](./ENGINEERING-GUIDE.md) |

---

## What this project is

Anuprerna is a handloom and artisan-textile commerce business. This monorepo is a **self-owned
rebuild** of its platform, replacing a vendor-locked stack — the Java "Loom" backend, the Angular
"Weave" admin, and the Angular "Fabric" storefront — with a stack the business fully controls.

The migration follows the **strangler-fig** pattern: stand the new system up alongside the old one and
replace it incrementally, rather than a big-bang rewrite of a live revenue system.

| Legacy (vendor-locked) | Replacement (this repo) | Status |
|---|---|---|
| Loom — Java/Spring backend | `apps/api` — NestJS | Built, **not deployed**. No production traffic. |
| Weave — Angular admin | `apps/cms` — Next.js 16 | Serving, via the legacy backend |
| Fabric — Angular storefront | `apps/storefront` — Next.js 15 | Serving, via the legacy backend |
| Weft — Flutter artisan app | — | Out of scope |

**The single most important fact about the current state:** both frontends are rebuilt and running, but
they still talk to the *legacy Java backend* in production. `apps/api` exists and compiles, but nothing
routes to it yet. Any document, diagram or agent instruction that implies otherwise is wrong.
See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the diagram and [`KNOWN-GAPS.md`](./KNOWN-GAPS.md) for
the full ledger.

---

## Repository layout

```
apps/
  api/          NestJS backend, replaces Loom          → container   (built, not deployed)
  storefront/   Next.js 15 public site, replaces Fabric → Vercel
  cms/          Next.js 16 admin, replaces Weave        → Vercel
  worker/       background jobs                         → container  (stub)
packages/
  types/        Zod schemas — the cross-app contract
  ui/           shared React components                 (empty)
  config/       shared lint/tsconfig                    (no consumers)
docs/           this folder
tests/          cross-app contract and e2e             (empty)
```

---

## The commands

Four gates. All four are green on this branch, and CI runs exactly these on every push and pull request
(`.github/workflows/ci.yml`).

```bash
pnpm install
pnpm lint         # 3/3 packages
pnpm typecheck    # 6/6 packages
pnpm test         # 5/5 packages — unit tests only, no services required
pnpm build        # 5/5 packages
```

Integration tests are deliberately separate, because they need a live Postgres and a clean checkout
must be able to run `pnpm test` green with nothing running:

```bash
pnpm --filter @anuprerna/api test:int    # requires DATABASE_URL
```

---

## How work gets done here

The governing principle, learned the hard way on this codebase:

> **A rule that is not mechanically enforced is not a rule, it is a wish.**

This repository previously had a well-written process — a spec per feature, TDD, handoff logs,
architectural invariants — and it was followed **zero times** across five merged pull requests that
shipped 45,000 lines of code with 5 test files and no CI. The documentation was not the problem; the
absence of anything that could fail was. Every rule in [`AGENT-FRAMEWORK.md`](./AGENT-FRAMEWORK.md) is
therefore labelled **ENFORCED** (something fails: CI, a type error, a lint rule, a test) or
**ADVISORY** (relies on review), so nobody mistakes an aspiration for a guarantee.

The loop:

1. A feature gets a spec in [`features/`](./features), from `_TEMPLATE.md`.
2. An agent reads the root `CLAUDE.md`, then the target app's `CLAUDE.md`, then the reference docs in
   this folder — **instead of** grepping the codebase to rediscover them.
3. One task per acceptance criterion. Tests first, then implementation.
4. All four gates green.
5. A handoff note is appended to the spec, so the next agent inherits context rather than re-deriving it.

---

## Reading order for someone new

1. This file.
2. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the shape of the system.
3. [`AGENT-FRAMEWORK.md`](./AGENT-FRAMEWORK.md) — how work is picked up and what the guardrails are.
4. [`DATA-FLOW.md`](./DATA-FLOW.md) — one real request, traced end to end.
5. [`KNOWN-GAPS.md`](./KNOWN-GAPS.md) — so you are not surprised by what is missing.
6. The `CLAUDE.md` of whichever app you are about to work in.
