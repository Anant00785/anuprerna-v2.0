# Unit-Test Build-Out Plan — anuprerna-platform (`chore/agent-substrate`)

Date: 2026-08-12. Baseline: 5 test files / 12 cases. Target: ~340 meaningful unit tests (see §1 for why not 400).

---

## 1. Budget — where the tests come from

I verified the code before budgeting. Key facts that shape it:

- `apps/api/src/commerce` has **99 validator/sanitizer/mapper files** (`find apps/api/src/commerce \( -name '*validator*' -o -name '*sanitizer*' -o -name '*mapper*' \) | wc -l` → 99). Spot-checks show they are near-pure (0–2 imports). This is the single largest supply of cheap, genuinely meaningful tests, and `docs/backend/commerce/04-migration-checklist.md` already specifies the rules per subdomain.
- `apps/cms` has 24 static-class services all funnelling through `unwrapResponseData()` (36 lines, 6 distinct branches — pure function, high blast radius).
- `apps/storefront` has 4 adapters + 5 repositories (~1,000 LOC total) and `filter-engine.ts` (367 LOC, pure).
- `packages/types` has exactly one schema. There is nothing else to test there today.

### Budget (sums to 340)

| Area | Tests | Basis |
|---|---|---|
| **api: commerce validators + sanitizers** | **110** | ~45 files; avg 2–3 cases each (valid / each rejection rule / boundary). Migration checklist rows A1–A9, D1–D20, E8–E10 give the exact rules. |
| **api: commerce mappers** | **50** | ~35 mapper files; round-trip + null/missing-field cases. Skip trivial pass-through mappers — do not pad. |
| **api: high-risk service logic** | **50** | 6 targets only: payment/stripe-webhook dispatch table (E11 checklist: sig valid/invalid/missing, 5 event types + default, malformed-payload-returns-200), order attribution (C3: click-id > UTM > untouched), cart totals (A5), catalog ownership chain (B9/B11/B21/B25 `NO_ACTION`-not-error semantics), order-preview 4-form search (C29), review sanitizer/service. |
| **api: common (middleware, filters, pipes, interceptors)** | **15** | request-id middleware exists+tested; add exception filters, envelope interceptor if present. |
| **storefront: adapters** | **25** | 4 adapters; legacy↔nest shape fidelity, missing/null fields, price/image edge cases. |
| **storefront: repositories** | **25** | 5 repos over MSW: happy path, error envelope, 401, empty list each. |
| **storefront: `lib/plp/filter-engine.ts`** | **25** | Pure logic: each filter type, combination, empty result, sort stability. |
| **storefront: stores + misc utils** | **10** | Extend existing auth/cart store suites. |
| **cms: `unwrapResponseData`** | **12** | All 6 branches × edge cases. Highest ROI file in the repo. |
| **cms: services over MSW** | **45** | 12 of 24 services (catalog, product, inventory, user, settings, workflow, review, logistic, loyalty, content, report, artisan) × ~4 each: URL/params correct, unwrap of realistic envelope, error propagation, mutation payload shape. Skip diagnostics/table-explorer/cron — thin wrappers. |
| **cms: AuthService + ConfigurationService** | **13** | localStorage token lifecycle (jsdom), env-at-module-load via `vi.stubEnv` + dynamic import. |
| **packages/types: customer schema** | **10** | Deepen the existing schema's edge cases. Do NOT invent schemas to hit a number. |
| **Total** | **340** | |

### Pushback on 300–400
340 is the honest number. Getting to 400 would mean either (a) testing the ~80 mechanically identical table-explorer/admin-pagination endpoints (checklist row: "mechanically identical shape verified across every entity" — one representative test protects all of them), or (b) component-testing 600-line CMS pages, which are untestable without refactors this plan deliberately avoids. Both are padding. If the owner insists on 400, the extra 60 should come from Zod schemas in `packages/types` for the API boundary — but that is *writing new product code*, a different project. **Owner decision: accept 340, or fund the Zod-schema workstream.**

---

## 2. The `@ts-nocheck` problem

All 99 validator/sanitizer/mapper files carry `@ts-nocheck` (verified: 0 files without it). Position: **de-nocheck is part of each test task, scoped to the file under test — never a separate upfront phase.**

Rules for test-writing agents:
1. Before writing tests for file X, delete `// @ts-nocheck` from X and run `pnpm --filter @anuprerna/api typecheck`.
2. If errors are confined to X: fix types in X (usually replacing `: any` params with the DTO type). Behavior must not change — the tests you're about to write are the check.
3. If errors cascade into files outside your ownership (imports from nocheck'd entities/repos): replace `@ts-nocheck` with per-line `// @ts-expect-error` at the offending lines, or leave `@ts-nocheck` and note it in the handoff log. Do not chase the cascade.

Do **not** de-nocheck controllers/repositories/services outside the 6 high-risk targets. 387 nocheck'd files is a separate typing project; blocking 340 tests on it would kill this effort. Testing untyped code is fine — tests pin runtime behavior, which is exactly what an untyped Java port needs most. Expected outcome: ~110 of the 387 files de-nocheck'd as a free side effect.

---

## 3. Java port: characterize or contract?

**Hybrid, with the docs as tiebreaker — and the checklist's 🟡 flags as law.**

- **Validators, sanitizers, auth codes: test against the documented contract** (`docs/backend/commerce/02-api-documentation.md`, 248 lines, per-route rules). These rules were deliberately specified (quantity ≥0.5, unit/orderType enums, Stripe email-length/currency/amount>0/paymentType∈{advance,remaining}). If the port diverges from the doc, that is a bug — file it in the spec's handoff log, and write the test against the doc, marked `it.fails(...)` until fixed. This is the one place tests are allowed to be red-by-design (kept out of CI via `it.fails` semantics, which pass while the bug exists and fail loudly when someone fixes it).
- **Everything else: characterization.** Services, mappers, ownership chains — lock in current behavior. Zero production traffic means no user depends on current behavior, but *you* have no better oracle than the code + the Java source you can't run. Characterization tests are the safety net for the de-nocheck typing work in §2 and any future refactor.
- **Never "fix" the flagged intentional oddities.** The checklist explicitly marks: the weak `CustomOrderValidator` (item-only check), the `PATCH`-not-`POST` custom-order-items route, B3's unfiltered-limit bug, Razorpay's `return true` validator stub, and the webhook's malformed-payload-200. Write tests that **pin these as-is** with a comment linking the checklist row. A Sonnet agent's instinct will be to strengthen them; the per-agent brief must forbid it.

---

## 4. Mocking strategy

**Frontends: MSW, non-negotiable.**
- Add `msw` as devDependency in `apps/storefront` and `apps/cms`.
- Shared setup file per app: `src/test/msw.ts` exporting `server = setupServer(...)` with `server.listen({ onUnhandledRequest: 'error' })` in `beforeAll`. Wired via `vitest.config.ts` `setupFiles`. No test can ever reach the live backend; an unmocked request is a test failure.
- Handlers return the **real RainTree always-200 envelope** (`{success, message, <listKey>: [...]}`) so `unwrapResponseData` is exercised for real, not against a fantasy shape.

**apps/api: plain instantiation with hand-rolled fakes. Not `Test.createTestingModule`.**
- Correction to the brief: ports-as-interfaces exist **only in payment** (`apps/api/src/commerce/payment/ports/payment.ports.ts` — OrderServicePort, EmailServicePort, WhatsappServicePort, CartServicePort). The other 5 high-risk services inject concrete repositories/services. So the "gift" is real but payment-only.
- Validators/sanitizers/mappers: pure functions or classes with no deps — call them directly. No mocking at all. This is why they're 160 of the 225 api tests.
- Payment service: `new PaymentService(fakeOrderPort, fakeEmailPort, ...)` with object-literal fakes implementing the port interfaces. `Test.createTestingModule` adds ~15 lines of DI ceremony per suite and buys nothing here since we're not testing wiring.
- The other 5 services: `new Service(fakeRepo as any)` with object-literal fakes exposing only the methods the test path touches. If a service's constructor graph is too deep (>4 deps), that's a signal to test its extracted logic instead, not to mock harder.
- Exception: if a test genuinely needs guards/interceptors/pipes in the loop, that's an integration test — out of scope, lives in `vitest.int.config.ts`.

---

## 5. Testability refactors: required vs. avoidable

**Confirming your prior: no DI refactor of CMS services.** Static classes over a module-level axios singleton are fine under MSW — MSW intercepts at the network level, below axios. `AuthService`'s static `localStorage` calls work under jsdom. Verified minimum changes before any CMS test can run (all config, one dead-code note):

**Required (Phase 0, blocking):**
1. `apps/cms/vitest.config.ts` — jsdom env, `setupFiles: ['src/test/setup.ts']`, path aliases matching `tsconfig.json`.
2. `apps/cms/package.json` — `"test": "vitest run"` script; devDeps: `vitest`, `jsdom`, `msw`, `@testing-library/jest-dom` (react testing-library only if component tests ever happen — skip for now).
3. `apps/cms/src/test/setup.ts` + `src/test/msw.ts` — server lifecycle, `onUnhandledRequest: 'error'`, localStorage cleared per test.
4. `apps/storefront/src/test/msw.ts` — same, added to existing vitest setup.
5. `apps/api/package.json` — **remove `--passWithNoTests`** (it currently lets the whole api suite silently vanish).

**Not required (explicitly rejected):**
- Constructor-injecting axios into CMS services — MSW covers it.
- Extracting fetch logic from 600-line CMS pages — those pages get zero tests in this plan; their logic lives in the services we do test.
- Refactoring `ConfigurationService`'s env-at-module-load: handled per test with `vi.stubEnv(...)` + `vi.resetModules()` + `await import(...)`. Ugly but 3 lines per test vs. a source change.

**One deletion, not a refactor:** `apps/storefront/src/lib/api.ts` (27 lines, zero importers, dead). Delete it in Phase 0 so no agent wastes a session testing dead code. Same instruction repo-wide: **check importers before testing any file.**

---

## 6. `packages/testkit`: do not create it

`packages/ui` and `packages/config` are empty-with-no-consumers in this same repo — the pattern is established and it's a warning. A shared testkit would hold: envelope fixtures, entity factories, MSW handler builders. But storefront and cms consume **different backends' shapes** through different clients, and api tests need no HTTP mocking at all. The actual shared surface is one envelope shape, ~20 lines.

Instead: per-app `src/test/` directories (`fixtures.ts`, `factories.ts`, `msw.ts`). Duplicate the envelope fixture between the two frontends — 20 duplicated lines is cheaper than a package with build config, exports map, and turbo wiring that history says will rot. Revisit only if a third consumer appears (e.g. Playwright later).

---

## 7. Sequencing and parallelization

### Phase 0 — Foundations (1 agent, serial, must land first)
Everything in §5 "Required", plus: CI coverage wiring (§8), `docs/TESTING.md` update describing conventions (co-located `*.spec.ts` for api per CLAUDE.md, `*.test.ts` for frontends per existing pattern), and a per-agent brief file containing the §2 de-nocheck rules and §3 "do not fix flagged oddities" law. Verify gate: `pnpm test` still 5/5 green, `pnpm --filter @anuprerna/cms test` runs (0 tests, but the runner works — temporarily keep `--passWithNoTests` on cms only until Wave 1 lands).
**Effort: half a day of agent time. Nothing fans out before this merges.**

### Wave 1 — 8 parallel agents (no file overlaps; each owns whole directories)

| Agent | Owns (exclusively) | Tests |
|---|---|---|
| A1 | `apps/api/src/commerce/{cart,catalog,material,inventory}/validators+mapper` | ~55 |
| A2 | `apps/api/src/commerce/{payment,workflow,tenant,profile,review}/validators+mapper` | ~55 |
| A3 | remaining commerce `validators/`+`mapper/` dirs (whatsapp, navigation, nverse, settings, support, …) | ~50 |
| A4 | `apps/api/src/commerce/payment/` services + ports; stripe-webhook | ~25 |
| A5 | `apps/api/src/commerce/{order,order-preview,custom-order}` service logic + `apps/api/src/common` | ~40 |
| A6 | `apps/storefront/src/lib/api/` (adapters+repositories) + delete dead `lib/api.ts` | ~50 |
| A7 | `apps/storefront/src/lib/plp/` + `src/stores/` + utils | ~35 |
| A8 | `apps/cms/src/lib/api-helper.ts` + `apps/cms/src/services/` (all) + AuthService/ConfigurationService | ~70 |

Collision rules: agents create only `*.spec.ts`/`*.test.ts` inside their owned dirs, may edit source **only** to remove `@ts-nocheck`/fix types in owned files, and never touch shared config (Phase 0 froze it). A8 is the largest; split into A8a (api-helper + 6 services) / A8b (6 services + auth/config) if a 9th agent slot exists.

### Wave 2 — 1 agent, serial (after all Wave 1 merges)
Coverage-threshold ratchet to actuals (§8), remove cms `--passWithNoTests`, dedupe any fixture drift, reconcile test counts, update `docs/TESTING.md` numbers.

### Effort, honestly
~340 tests at a realistic Sonnet throughput of 30–50 meaningful tests per agent-session (including de-nocheck friction and checklist reading): **8–11 agent-sessions of writing + Phase 0 + Wave 2 ≈ 10–13 sessions total. Wall-clock with 8-way parallelism: 2–3 days including human review of ~9 PRs. Serialized: 1.5–2 weeks.** The api validator work is fast; A4/A5 (webhook dispatch, order attribution) are the slow, high-value tail — expect those agents to produce fewer tests per hour and don't rush them.

---

## 8. Enforcement — how it stays above 12

1. **Kill silent-empty suites.** Remove `--passWithNoTests` everywhere (api in Phase 0, cms in Wave 2). After that, deleting all tests in a package fails `pnpm test`.
2. **Coverage thresholds, not test-count floors.** Test counts are gameable; coverage of the directories we chose to protect is not. Add `@vitest/coverage-v8` and per-package `coverage.thresholds` scoped via `include` to the tested layers only (api: `src/commerce/**/{validators,mapper}/**`, `src/common/**`; storefront: `src/lib/{api,plp}/**`, `src/stores/**`; cms: `src/lib/api-helper.ts`, `src/services/**`). Initial thresholds set in Wave 2 at **(actual − 2%)**; validators/mappers should land near 95%+ lines. Whole-app thresholds would either be uselessly low or block unrelated work — scope them to what we protect.
3. **CI wiring** in `.github/workflows/ci.yml`, existing unit job: change `pnpm test` to `pnpm test -- --coverage`. Fails when any package drops below its thresholds. Integration job untouched.
4. **Ratchet mechanics:** manual, quarterly-or-on-touch — when a PR meaningfully raises coverage, its author bumps the threshold to (new actual − 2%). No auto-ratchet bot; this repo doesn't have the traffic to justify the infra, and auto-ratchets get disabled the first time they flake. **Owner decision if they want the bot anyway.**
5. **The existing rule already exists** — root `CLAUDE.md` mandates TDD and "no feature merges without tests"; CI comment says "green before merge". The decay to 12 tests happened because nothing *executable* enforced it. Items 1–3 are the executable version.
6. Mechanical checks that must pass at completion:
   - `pnpm test -- --coverage` — green, thresholds enforced.
   - `pnpm --filter @anuprerna/api test 2>&1 | grep -c 'passWithNoTests'` → 0 occurrences in scripts.
   - `grep -rl '@ts-nocheck' apps/api/src/commerce --include='*validator*' --include='*sanitizer*' --include='*mapper*' | wc -l` → 0 (down from 99; PLAUSIBLE a handful remain per §2 rule 3 — acceptable if logged).
   - `find apps -name '*.test.ts' -o -name '*.spec.ts' | wc -l` → ≥ 60 files (informational, not a gate).

---

## Confidence ledger

**Confident:** the budget's supply-side numbers (file counts verified); MSW obviating CMS refactors; plain-instantiation over TestingModule for api; no-testkit; the de-nocheck-as-you-go sequencing; `--passWithNoTests` removal.
**Needs owner decision:** 340 vs. 400 (and funding Zod schemas if 400); auto-ratchet bot vs. manual; whether `it.fails` doc-contract divergences should instead be fixed immediately (touches "don't silently fix" rule — I'd file-and-pin, owner may prefer fix-now since there's zero traffic); B3/E2/E3 🟡 items remain team decisions per the checklist, tests pin current behavior until decided.

### Critical Files for Implementation
- /Users/saqlainrashid/Downloads/Anuprerna/anuprerna-platform/docs/backend/commerce/04-migration-checklist.md
- /Users/saqlainrashid/Downloads/Anuprerna/anuprerna-platform/docs/backend/commerce/02-api-documentation.md
- /Users/saqlainrashid/Downloads/Anuprerna/anuprerna-platform/apps/cms/src/lib/api-helper.ts
- /Users/saqlainrashid/Downloads/Anuprerna/anuprerna-platform/apps/api/src/commerce/payment/ports/payment.ports.ts
- /Users/saqlainrashid/Downloads/Anuprerna/anuprerna-platform/.github/workflows/ci.yml
