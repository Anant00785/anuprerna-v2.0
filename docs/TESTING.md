# Testing — strategy and catalogue

Honest baseline, verified by running the commands, 2026-08-12 on `main` (post-merge of
`chore/agent-substrate`):

> **589 tests total is the figure this document started the day quoting; the actual measured
> total, re-run for this pass, is 588 across the four workspaces `pnpm test:coverage` covers
> (`apps/api` 330, `apps/cms` 93, `apps/storefront` 163, `packages/types` 2), plus 4 more passing
> in `apps/api`'s separate integration suite and 1 gated skip — 593 repo-wide including
> integration. Up from 12 at the start of the day. `apps/cms` went from zero tests and no vitest
> config to 15 files / 93 tests. CI now exists and is green.**

This is not a criticism of any one PR — it's the honest state of play. The point of this document
is to keep the baseline accurate, not to let a good day of work calcify into a stale number.

## 1. The pyramid

Three layers exist in configuration; only the first has meaningful coverage today.

| Layer | Pattern | Where | Needs | Status |
|---|---|---|---|---|
| Unit | co-located `*.spec.ts` (api), `*.test.ts` / `*.test.tsx` (storefront, cms, types) | next to the code under test | nothing external (MSW mocks the network — see §4) | 588 tests total, see catalogue below |
| Integration | `*.int.spec.ts` | `apps/api/src/**` | a live Postgres | 2 files (`database.int.spec.ts`, `gatekeeper.pepper.int.spec.ts`), run via `pnpm test:int`. 4 tests pass; the pepper test is gated behind `RUN_SECRET_TESTS=1` (needs real production hashes) and is skipped otherwise — CI does not set that flag |
| Cross-app e2e | Playwright (planned) | `tests/` | a running storefront + CMS + api | **still empty** — `tests/` contains only `tests/CLAUDE.md`; Playwright is **not installed** (`grep -rn playwright package.json apps/*/package.json` → no matches). Unchanged from the prior pass |

The unit/integration split in `apps/api`:
- `apps/api/vitest.config.ts` — `include: ["src/**/*.spec.ts"]`, `exclude: ["src/**/*.int.spec.ts"]`. This is what `pnpm test` runs; it needs no services up.
- `apps/api/vitest.int.config.ts` — `include: ["src/**/*.int.spec.ts"]`, needs `DATABASE_URL` reachable. Run with `pnpm --filter @anuprerna/api test:int` or `cd apps/api && pnpm test:int`.

This split is what lets CI run integration tests as a separate job against a real
`pgvector/pgvector:pg16` Postgres (`.github/workflows/ci.yml`), while `pnpm test` on a clean
checkout with no services running still passes.

## 2. Commands — what to run, and what actually happens

All re-verified by running them on 2026-08-12 on `main`, not assumed from a prior pass.

| Command | Result | Detail |
|---|---|---|
| `pnpm test:coverage` (the CI gate) | **6/6 tasks green, 588 tests total** | `@anuprerna/types` (2), `@anuprerna/storefront` (163), `@anuprerna/cms` (93), `@anuprerna/api` (330), `@anuprerna/worker` (0, `--passWithNoTests`, no test files), plus a 6th task (`@anuprerna/config`, a no-op — it has no test script) that turbo still counts as a completed task |
| `pnpm typecheck` | **6/6 tasks green** | `@anuprerna/types`, `@anuprerna/cms`, `@anuprerna/api`, `@anuprerna/worker`, `@anuprerna/storefront`, plus one more. Zero errors across the board |
| `pnpm lint` | **3/3 tasks green** | `@anuprerna/api`, `@anuprerna/cms`, `@anuprerna/storefront` — the only three workspaces with a lint script |
| `pnpm build` | **5/5 tasks green** | `@anuprerna/api`, `@anuprerna/cms`, `@anuprerna/storefront`, `@anuprerna/worker`, `@anuprerna/types` |
| `apps/api`: `pnpm test:int` | **Run this pass against local Postgres at `localhost:5433`** | 1 file / 4 tests pass (`database.int.spec.ts`), 1 file / 1 test skipped (`gatekeeper.pepper.int.spec.ts`, gated behind `RUN_SECRET_TESTS=1`) |
| e2e (`tests/`) | N/A — no runner installed, no specs written | Unchanged from the prior pass |

CI (`.github/workflows/ci.yml`) runs `lint → typecheck → test:coverage → build` as one job and
the integration suite as a separate job against a real Postgres, plus a gitleaks secret scan.
Green on `main` as of this pass.

## 3. The test catalogue

82 spec/test files now exist across the repo (52 in `apps/api`, 15 in `apps/cms`, 14 in
`apps/storefront`, 1 in `packages/types`), so an exhaustive per-`it` table is no longer practical
to hand-maintain here — that level of detail belongs in a generated catalogue
(`scripts/gen-docs/index.mjs` produces one under `docs/generated/`, per the root `CLAUDE.md`).
What follows is a representative sample per area, not the full list:

| File | Behaviour protected |
|---|---|
| `packages/types/src/schemas/customer.schema.test.ts` | The one Zod schema in the repo accepts a well-formed payload and rejects a bad email/unknown provider |
| `apps/storefront/src/stores/cart.store.test.ts`, `auth.store.test.ts` | Zustand store mutations (add/remove/clear, login/logout state) |
| `apps/storefront/src/lib/api/adapters/legacy-cart.adapter.test.ts`, `legacy-catalog.adapter.test.ts` | The delivery-charge and out-of-stock falsy-zero bugs now assert **correct** behaviour — see `docs/KNOWN-GAPS.md`'s "Fixed" table |
| `apps/api/src/database/database.int.spec.ts` | Drizzle client reaches Postgres, the introspected `schema.loomTenant` mapping matches the live DB shape, and a relational query across a foreign key resolves |
| `apps/api/src/auth/service/gatekeeper.service.spec.ts` | `bcrypt(pepper + password)` cost 11 hashing/verification behaviour, unit-level |
| `apps/api/src/auth/service/gatekeeper.pepper.int.spec.ts` | Stored password hashes on real accounts are bcrypt cost-11 — gated behind `RUN_SECRET_TESTS=1`, skipped by default and in CI |
| `apps/api/src/commerce/payment/service/razorpay-payment.service.spec.ts`, `stripe-payment.service.spec.ts` | Pins the **absence** of signature verification as current behaviour (checklist rows E1/E2) — written to fail loudly the moment verification is added, per §5 of the rules below |
| `apps/api/src/commerce/*/validators/*.spec.ts`, `*/mapper/*.spec.ts` | The bulk of `apps/api`'s 330 tests — one representative test per validator/sanitizer/mapper across ~20 commerce sub-domains (cart, order, review, inventory, material, tenant, seo, profile, skill, faq, pattern, shipment, settings, nverse, image, search, payment) |
| `apps/cms/src/services/settings-service.test.ts` and others under `src/services/*.test.ts` | Settings/logistics services now assert honest error propagation instead of fabricated success — see `docs/KNOWN-GAPS.md`'s "Fixed" table, item 6 |
| `apps/api/src/common/middleware/request-id.middleware.spec.ts` | Middleware logic works in isolation — **but see `docs/KNOWN-GAPS.md`: this middleware is never registered in `app.module.ts`, so this test protects code that never runs in a real request** |

## 4. How to write a test here

The working pattern is `apps/storefront/src/stores/cart.store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cart.store";

describe("cart.store", () => {
  beforeEach(() => useCartStore.getState().clear());

  it("adds and removes items", () => {
    useCartStore.getState().add({ productId: 1, qty: 2 });
    expect(useCartStore.getState().items).toHaveLength(1);
    useCartStore.getState().remove(1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
```

Rules that generalize from it:
1. **Co-locate**: `foo.ts` → `foo.test.ts` (storefront/types) or `foo.spec.ts` (api), same directory.
2. **Reset shared state in `beforeEach`** — Zustand stores are module-level singletons; without
   `.clear()` here, test order would leak state between `it` blocks.
3. **No network in a unit test.** `cart.store.test.ts` never calls `fetch`; it only exercises the
   in-memory store. That's what makes it fast and deterministic.

### The HTTP-mocking approach: MSW is now installed and wired in both frontends

Corrects the prior pass, which said MSW was "not yet installed." It now is:
`apps/storefront/package.json` and `apps/cms/package.json` both carry `"msw": "^2.6.0"`, with
handlers at `apps/storefront/src/test/msw.ts` and `apps/cms/src/test/msw.ts`, started in
`apps/storefront/vitest.setup.ts` with `onUnhandledRequest: "error"` — the guard described in
rule §1 below. This intercepts at the network layer (real `fetch` calls hit a mock handler keyed
by URL/method) rather than mocking the calling code, which matters specifically because
`apps/storefront/src/lib/api/repositories/*.ts` and `apps/cms/src/services/*.ts` call
`fetch`/axios directly against `NEXT_PUBLIC_SPRINGBOOT_API_URL` / `TARGET_HOST` — **live
production hosts** (see `docs/KNOWN-GAPS.md`). An unmocked request now fails the test instead of
silently hitting `https://loom-v2.anuprerna.com`.

## 5. Testability blockers

Specific, not generic — each blocks a specific kind of test and has a specific remedy.

| Blocker | Evidence | What it blocks | Remedy |
|---|---|---|---|
| CMS services are static classes over a module-level `apiClient`/axios singleton | All 24 files in `apps/cms/src/services/*.ts` | No dependency injection seam — every test needs `vi.mock('@/lib/api')` at the module level instead of injecting a test double, which couples tests to import paths | Either move to an instance-based client that can be constructed with a mock, or accept `vi.mock` + MSW at the network layer (see §4) so the mock lives below the client, not inside it |
| `AuthService` touches `localStorage`/`window` directly in static methods | `apps/cms/src/lib/auth-service.ts:28-45,51-55` | Cannot unit test in a non-DOM environment or swap storage for a test double without a global `jsdom` + manual `localStorage.clear()` in every test file | Wrap storage access behind an injectable interface, or accept jsdom + explicit setup/teardown per test file as the standing convention |
| `ConfigurationService` bakes `process.env` at module load | `apps/cms/src/lib/config.ts:1,22,24` | Config is fixed at first import; a test cannot reconfigure it per-case without `vi.resetModules()` gymnastics | Make config a function call (`getConfig()`) rather than a module-level constant, so tests can stub `process.env` before calling it |
| Several CMS pages exceed 600 lines mixing fetch, state, and JSX | `apps/cms/src/app/manage-artisans/page.tsx` (631 lines), `apps/cms/src/app/inventory/notification/page.tsx` (610), `apps/cms/src/app/manage-whatsapp/audit_log/page.tsx` (595), `apps/cms/src/app/manage-product/product-sub-category/page.tsx` (577), `apps/cms/src/app/filter-page-seo/page.tsx` (554), `apps/cms/src/app/manage-artisans/update/[id]/page.tsx` (541), `apps/cms/src/app/manage-feedback/page.tsx` (534) | Nothing in these files is unit-testable in isolation — data fetching, form state, and render are one undifferentiated block, so any test is effectively an e2e test wearing a unit-test config | Extract data-fetching into a hook (`useArtisans()`) and form logic into a separate function, testable without rendering the page; render logic then becomes thin enough not to need heavy coverage |
| 348 of 628 `apps/api` `.ts` files carry `@ts-nocheck` (re-verified this pass; corrects the prior pass's 387/573, which was measured pre-merge) | `grep -rl "@ts-nocheck" apps/api/src \| wc -l` → 348; `find apps/api/src -name "*.ts" \| wc -l` → 628 | Type errors in these files are invisible to `tsc` — and this is not theoretical: the boot-breaking bug fixed today (four broken imports; see `docs/KNOWN-GAPS.md`) was concealed by exactly this pattern, in files that passed every gate | Remove `@ts-nocheck` file-by-file as each module gets real tests, not as a standalone cleanup pass — pairing the two means the removal is validated immediately |

## 6. Coverage policy: a ratchet, not a fixed target

No fixed percentage target (e.g. "80% coverage"). On a 45,000+ LOC codebase currently sitting at
9 tests, a fixed number is either so far away it gets ignored, or gets gamed with shallow tests
written to hit the number rather than protect behaviour. Neither outcome is useful.

Instead: **a ratchet**. Record the current coverage baseline per workspace (once a coverage
reporter is wired up — not done yet, since `vitest run` here doesn't currently pass `--coverage`
in any package script) and enforce, in CI once it exists, that a PR cannot *decrease* the
recorded baseline for any workspace it touches. It can add zero net-new coverage on an unrelated
workspace; it cannot regress the one it changes. This makes the bar "don't make it worse" rather
than "hit an arbitrary number," which is achievable starting from 9 tests and gets stricter
automatically as more tests land — the ratchet only ever tightens.

## 7. Corrections made during this verification pass

- The 143-error CMS typecheck failure cited by the source audit is not reproducible on
  `chore/agent-substrate` — `pnpm typecheck` passes 6/6 today. Documented as resolved-or-stale in
  `docs/KNOWN-GAPS.md`; not re-asserted as a current failure here.
- `pnpm test` "failing" in the source audit was specific to `database.spec.ts` dialing a live
  Postgres inside the default unit-test task; the `*.int.spec.ts` split (`apps/api/vitest.config.ts`
  vs `apps/api/vitest.int.config.ts`) has already fixed this on the current branch — `pnpm test`
  is green.

---

# Current baseline (2026-08-12)

| Package | Test files | Tests | Coverage (lines) | Threshold |
|---|---|---|---|---|
| `apps/api` | 46 | 279 | 35.5% | 33% |
| `apps/storefront` | 13 | 126 | 82.0% | 80% |
| `apps/cms` | 15 | 90 | 29.5% | 27% |
| `packages/types` | 1 | 2 | — | — |
| **Total** | **75** | **497** | | |

Up from 5 files / 12 tests at the start of the day. Coverage is scoped in each `vitest.config.ts`
to the layers listed there, not whole apps — `apps/api`'s 35.5% line coverage sits alongside 91%
branch and 94% function coverage, because the include glob spans validator/mapper directories where
some files are tested exhaustively and others are not yet touched.

Thresholds are set at `(actual − 2%)`. They are a floor that ratchets upward, not a target.

## What the suites found

Writing these tests surfaced defects that no amount of reading had. They are catalogued in
[`KNOWN-GAPS.md`](./KNOWN-GAPS.md), not repeated here, but the shape is worth knowing:

- Payment signature verification present in the live Java backend and **absent from the port**.
- Two money-affecting bugs in live storefront code (delivery charge, stock availability).
- Services that fabricate success or data when the backend fails.
- Roughly 50 auto-generated CRUD controllers serving generic tables that do not exist in the schema.

None were fixed while testing. Every one is pinned by a test asserting current behaviour, written to
fail the moment someone corrects it. That is deliberate: a test run should tell you when behaviour
changes, and changing customer-visible behaviour is a decision, not a side effect.

---

# Writing tests here — the rules

Binding on every agent and every contributor writing tests in this repo. The plan behind these rules,
including the per-area budget, is in the programme's test plan; this section is the operative part.

## 1. Never let a test reach the network

Both frontends serve real users from the **live** legacy backend. A test that escapes to the network
hits production data.

- MSW is configured in both frontends with `onUnhandledRequest: "error"`. An unmocked request is a
  test failure, by design. **Do not relax this to `"warn"` or `"bypass"`.**
- Handlers live in `apps/<app>/src/test/msw.ts`. Fixtures must use the **real** response envelope
  (`{success, message, <listKey>: [...]}`), because that is what `unwrapResponseData()` actually
  parses. A flat-array fixture silently bypasses the unwrapping every CMS response depends on.
- No test may contain a production hostname. `loom-v2.anuprerna.com` must never appear in a test file.

## 2. Check for importers before testing anything

`apps/storefront/src/lib/api.ts` had zero importers and was mandated by three separate documents. An
agent could have spent a session testing dead code. **Before writing a test, confirm the file is
actually used.** If it is not, say so in your handoff instead of testing it.

## 3. `@ts-nocheck` — remove it as you go, never in bulk

387 of 573 files in `apps/api` carry `@ts-nocheck`. Do not treat that as a project.

1. Before testing file X, delete its `// @ts-nocheck` and run `pnpm --filter @anuprerna/api typecheck`.
2. If errors stay inside X, fix them — usually replacing an `any` parameter with its DTO type.
   **Behaviour must not change**; the tests you are about to write are the check on that.
3. If errors cascade into files you do not own, stop. Either use per-line `// @ts-expect-error`, or
   restore `@ts-nocheck` and note it in your handoff. **Do not chase the cascade.**
4. **Never add `@ts-nocheck` to a new file.**

## 4. Testing a port you did not write

`apps/api` is a transliteration of the Java Loom backend. It carries zero production traffic, and no
one on this team wrote its business rules. So:

- **Validators, sanitizers, auth codes:** test against the documented contract in
  [`backend/commerce/02-api-documentation.md`](./backend/commerce/02-api-documentation.md), which was
  read from the Java source and gives per-route rules. If the port diverges from the doc, that is a
  bug: write the test against the **doc**, mark it `it.fails(...)`, and record it in your handoff.
- **Everything else:** characterization. Lock in current behaviour so the de-nocheck work in §3 and
  any future refactor have a safety net.

## 5. Do not "fix" the known-intentional oddities

[`backend/commerce/04-migration-checklist.md`](./backend/commerce/04-migration-checklist.md) flags
behaviours that look like bugs and are pending a **team** decision — the weak `CustomOrderValidator`,
the `PATCH`-not-`POST` custom-order-items route, the unfiltered catalog `limit`, the Razorpay
validator that returns `true`, the webhook returning 200 on a malformed payload.

Pin these as they are, with a comment naming the checklist row. Your instinct will be to strengthen
them. Do not. Changing them is a product decision, not a test-writing one.

## 6. Test what is worth protecting

Do not pad to hit a number. Around 80 table-explorer and admin-pagination endpoints are mechanically
identical — **one representative test protects all of them**, and writing 80 is noise that makes the
suite slower and the signal worse. Prefer: pure functions, validators, mappers, adapters, the
`unwrapResponseData` choke point, and money paths (payment webhooks, order attribution, cart totals,
ownership checks).

The 600-line `'use client'` CMS pages get no tests. Their logic lives in the services, which do.

## 7. Coverage is a ratchet, not a target

Thresholds are scoped in each `vitest.config.ts` to the directories we chose to protect, not whole
apps. They start at 0 and are raised to `(actual − 2%)` once suites land. Raise a threshold when you
meaningfully improve coverage; never lower one to make a build pass.

`--passWithNoTests` has been removed from `apps/api` so an empty suite fails loudly rather than
silently. It remains on `apps/cms` only until its first tests land, then goes.
