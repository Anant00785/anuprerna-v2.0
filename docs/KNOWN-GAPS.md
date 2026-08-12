# Known Gaps — the honest ledger

Every open item in the codebase lives here, grouped by area, so no other doc has to hedge.
Verified against `main` on 2026-08-12, post-merge of `chore/agent-substrate`. Format per item:
what's wrong, evidence, impact, status. "What to redo when X lands" flags where this entry goes
stale.

Related docs, not duplicated here: `docs/ARCHITECTURE.md`, `docs/DATA-FLOW.md`,
`docs/STATE-INVENTORY.md`, `docs/DATA-INVENTORY.md`, `docs/MODULE-MAP.md`,
`docs/AGENT-FRAMEWORK.md`, `docs/ENDPOINT-INVENTORY.md`, `docs/TESTING.md`.

## Fixed since the last revision of this document — kept here, not deleted

A great deal changed on `main` today. Deleting the history of a gap would hide how bad it was;
these are marked resolved instead.

| # | What was wrong | Fixed by | Verified |
|---|---|---|---|
| 1 | **The API never booted.** Four broken imports were concealed by files carrying `@ts-nocheck` — every gate (lint/typecheck/test/build) passed while `node dist/main.js` died at `MODULE_NOT_FOUND`. All gates were green and the server was still dead. | Commits `9f91ddc` (repaired 114 broken imports) and `ceab4c4` (corrected `ImageModule` import depth) | `apps/api` now boots and serves Swagger at `/docs` |
| 2 | **The committed schema had drifted from production**: 116 tables/68 enums vs production's 117/45. The 23 extra enums were phantom non-`_enum` twins (`order_status` beside `order_status_enum`) left over from a database that carried two naming generations production never had. `custom_impact_factor` was missing entirely. | Commit `91cbd74` — re-introspected read-only against live production through a temporary tunnel (now closed) | `schema.ts` now declares 117 tables / 45 enums, matching production exactly |
| 3 | **`TransactionStatus` was a numeric enum** (`PAID = 2`, etc.) written into a Postgres **string** enum column. Every transaction-status write would have been rejected outright by Postgres at runtime. | Commit `91cbd74` / `659250a` era work — corrected to string values matching the DB enum | `stripe-payment.service.spec.ts` and `razorpay-payment.service.ts` now use the string values |
| 4 | **Auth was broken for all password accounts.** `gatekeeper.service.ts` used scrypt; the legacy Java system uses `bcrypt(pepper + password)` at cost 11. The mismatch would have locked out all 3,784 password accounts on cutover. | Commit `659250a`, per `documentation/bmx-nverse.md:895-904` and `NVerseLaunchSequence1.java:141-159` | Confirmed against real production hashes: all 7,254 accounts are `$2a$11$…`, 60 chars. Split 3,784 BASIC / 3,390 GOOGLE / 80 UNKNOWN |
| 5 | **S3 uploads silently did nothing.** Category, segment and sub-category bound their storage ports to dummy adapters returning `""` while a real `ImageService` sat unused. | Commit `659250a` — all three now delegate to `ImageService` via `useFactory` adapters | `grep -rl ImageService` shows `category.module.ts`, `segment.module.ts`, `subcategory.module.ts` now import it |
| 6 | **Six live customer-facing bugs**, all "falsy zero" or fabrication bugs: delivery-charge overcharge on free shipping, out-of-stock shown as in stock, free items (`unitPrice`/`totalPrice: 0`) repriced, the profile envelope (`{success, addressList: [...]}`) never unwrapped so `.map()` threw, CMS reporting a failed settings save as successful, and CMS services fabricating data (including a fake `{success: true}`) on backend failure. | Commit `659250a` | Tests now assert **correct** behaviour instead of pinning the bug — see `docs/TESTING.md` |
| 7 | **The PLP discount calculation** was removed in commit `9361c3b`. | Commit `10aaae7` | Restored |
| 8 | **No CI existed.** Nothing enforced lint/typecheck/test/build staying green on a PR. | `.github/workflows/ci.yml` added | Two jobs: `verify` (lint → typecheck → test with coverage → build) and a separate `integration` job against a real `pgvector/pgvector:pg16` Postgres. A gitleaks secret scan also runs. Green on `main` as of this pass — verified by re-running all four gates locally: lint 3/3, typecheck 6/6, test 6/6, build 5/5 |
| 9 | Earlier revision said 50 auto-generated CRUD controllers "serve empty tables" and shadow real routes | Already corrected in a prior pass | They are dead code, wired into nothing — `RestApiControllers` is never imported anywhere. Correction carried forward below, unchanged |

## The one thing to say before anything else: the API still carries 0% of production traffic

| | |
|---|---|
| What | `apps/api` (117 controllers, 628 `.ts` files) now boots and serves real responses, but nothing in production points at it |
| Evidence | Both frontends still hardwire the legacy Java backend: `apps/storefront` via `NEXT_PUBLIC_SPRINGBOOT_API_URL` and the storefront/CMS `[...path]` proxies; CMS via `TARGET_HOST = 'https://loom-v2.anuprerna.com'` (`apps/cms/src/app/api/backend/[...path]/route.ts:3`) |
| Impact | Every remaining gap in `apps/api` below is still a pre-launch gap, not a live incident. The API booting is necessary but not sufficient — no cutover has begun |
| Status | Open. This is still the headline framing for the whole document |
| Redo when | `apps/api` is cut over for even one route in production — re-audit which items below actually matter under load |

## Bugs the test programme found in code serving live customers — now fixed

The six bugs previously pinned by tests-that-assert-the-bug are fixed. Kept here as a record of
what was wrong and where, since the history is useful.

| # | Bug (now fixed) | Where |
|---|---|---|
| 1 | Delivery overcharge on free shipping — `dto.deliveryCharge \|\| (subtotal > 2000 ? 0 : 150)` treated an explicit `0` as falsy | `apps/storefront/src/lib/api/adapters/legacy-cart.adapter.ts` |
| 2 | Out-of-stock shown as in stock — `dto?.availableQuantity ? ... > 0 : true` | `apps/storefront/src/lib/api/adapters/legacy-catalog.adapter.ts` |
| 3 | Profile repository returned the raw envelope instead of unwrapping it | `apps/storefront/src/lib/api/repositories/profile.repository.ts` |
| 4 | Free items (`unitPrice`/`totalPrice: 0`) got repriced by the same falsy-zero class of bug | storefront cart/catalog adapters |
| 5 | CMS reported a failed settings save as successful | `apps/cms/src/services/settings-service.ts` |
| 6 | CMS fabricated data on backend failure, including `createShipment` returning a fake success | `apps/cms/src/services/settings-service.ts`, `logistic-service.ts` |

Two items from the prior pass remain open and are **not** part of the fixed six — see the CMS
section below: `uploadReviewImage`'s missing multipart boundary, and `unwrapResponseData`'s
arbitrary key selection.

Cleared on inspection, worth recording as checked: logout **does** correctly clear all persisted
auth state in both apps.

## The schema now matches production — and the introspect trap remains a standing risk

**Status: fixed and verified**, per item 2 in the "Fixed" table above. `schema.ts` applies
cleanly and the integration suite passes against it, both locally against the disposable
`pgvector/pgvector:pg16` container and in CI.

But `drizzle-kit introspect` output does **not** compile or apply as generated, and this
regenerates every time the tool is re-run — it is a standing trap, not a one-time fix:

| # | Defect | Detail |
|---|---|---|
| 1 | 206 columns whose database default is the empty string emit `.default(')'` | An unterminated string literal — a generator bug. A schema regenerated by `db:introspect` does not compile until all 206 are repaired |
| 2 | `sub_category_audit.changed_at` default has unbalanced parentheses | A syntax error that aborts a raw-SQL apply partway through the table list |
| 3 | `idx_image_optimization_record_claim` uses `enum_ops` on a `bigint` column (`enqueued_at`) | Introspect applies `enum_ops` to all three indexed columns regardless of type |

All three repaired in the current `schema.ts` (commit `91cbd74`). Two extensions are also
required and undocumented by the tool: `vector` (embedding tables declare `vector(1536)`) and
`pg_trgm` (trigram indexes) — plain `postgres:16` cannot build either; CI uses
`pgvector/pgvector:pg16` and creates both explicitly.

> **Redo when:** anyone re-runs `pnpm db:introspect`. All three defects are regenerated by the
> tool and must be re-applied. Treat a fresh introspect output as unrunnable until proven
> otherwise: apply it to an empty database with `psql -v ON_ERROR_STOP=1` and count the tables
> (117) and enums (45).

## The "117 controllers" number is real but badly misleading

The honest breakdown, re-verified this pass:

| | Count | What it is |
|---|---|---|
| Controller files carrying `@Controller` | 117 | Real, hand-ported from the Java source |
| Auto-generated generic CRUD controllers | 50 | Machine-produced from a name list, not ported logic, and **never imported anywhere** |

### The 50 generic controllers are dead code, wired into nothing

`RestApiControllers` (`apps/api/src/commerce/rest-api.module.ts`) is never imported by any
module. `git log --all -S"RestApiControllers"` shows only the commit that defined it. They have
never been routable, and wiring them in would shadow 25 real controllers serving the same
resource names (`address`, `order`, `payment`, `review`, `search`, `seo`, `settings`, etc.) while
the other 25 would serve a generic `commerce_<resource>` table shape that does not exist in the
production schema.

| Impact | None today: unroutable. The risk is entirely future — anyone who "helpfully" wires this module in shadows 25 real controllers at once |
|---|---|
| Status | Documented in the file itself. Deletion deferred one release per plan JC-5 |
| Redo when | Deleting `rest-api.module.ts` — first verify each of the 25 colliding modules has genuinely migrated logic |

### Orphaned rich controllers, with thin generic ones wired in their place

Unverified in this pass — carried forward from the prior audit, needs a fresh grep. `order/`
previously had a 24-line generic `order.controller.ts` wired while the substantial port
(`order/controller/order.controller.ts` plus `custom-order`, `order-fulfillment`,
`order-feedback`) sat unimported. Re-check before relying on this.

## Payments: not implemented, and the port dropped signature verification the legacy system performs

Two separate problems, both open, both must be fixed before `apps/api` handles a single real
payment:

**No provider is actually wired up.** `grep -i "stripe\|razorpay" apps/api/package.json
package.json` returns nothing — no Stripe SDK, no Razorpay SDK, no provider dependency installed
anywhere in the repo. The payment services call a `repository` and construct response shapes, but
there is no outbound call to a real payment provider.

**Signature verification is absent, and the legacy Java backend does it correctly** — this is a
migration regression, not a pre-existing flaw:

| | |
|---|---|
| Razorpay (legacy, correct) | `RazorpayTransactionDAOController.java:273-282` calls `paymentService.isValidSignature(...)`, implemented via `Utils.verifyPaymentSignature`. Failure routes to dedicated failure codes |
| Razorpay (port) | `apps/api/src/commerce/payment/service/razorpay-payment.service.ts:62` — comment `// Verify signature here`, no verification of any kind. Execution proceeds straight to `TransactionStatus.PAID` |
| Stripe (legacy, correct) | `StripeWebhookController.java:125-132` calls `Webhook.constructEvent(...)`, returns 400 on `SignatureVerificationException` |
| Stripe (port) | `apps/api/src/commerce/payment/controller/payment.controller.ts:174-179` checks only that the `Stripe-Signature` header is **present**, with a comment saying real verification "would be constructed using the Stripe SDK" |
| Impact | A client can POST a fabricated payment success for a real order and the server marks it PAID. Combined with no SDK installed, payments cannot function at all today, correctly or otherwise |
| Status | Open. Pinned by tests asserting current (broken) behaviour, not fixed behaviour — the tests are written to fail loudly the moment verification is added |

Also open, unchanged from the prior pass: no idempotency on either provider (retries re-run the
whole success path), three documented Stripe events (`PAYMENT_INTENT_CREATED`, `PAYMENT_FAILED`,
`CANCELED`) have no handler, and Stripe input validation is weaker than the documented contract
(`paymentType`/`customerEmail`/`currency` under-validated) while `validateRazorpayPaymentInput`
is stricter than the documented Java source in one place — the port was not a faithful
transliteration in either direction.

## The Google OAuth path has never been verified

Of the 7,254 production accounts, 3,390 are `GOOGLE` provider. Auth for the 3,784 `BASIC`
accounts is now confirmed correct (bcrypt cost 11 against real hashes — see the "Fixed" table
above). **The Google OAuth flow itself has not been exercised against anything real.** This is
the largest unknown in whether people can actually log in after a cutover — a majority-adjacent
slice of the user base (47% of accounts) rides on an unverified path. No test, integration or
otherwise, exercises the Google token-exchange flow end to end.

| Status | Open — flagged, not yet worked |
|---|---|
| Redo when | Someone builds a way to test the OAuth flow against real or sandboxed Google credentials |

## Email encryption is deliberately a dummy

`EMAIL_ENCODER_PORT` is bound to a stub, on purpose. The real algorithm is
`AES/ECB/PKCS5Padding`, keyed via SHA-512 of `nverse.aes.key` truncated to 16 bytes — but the
exact truncation logic lives in a Bloom Java library this repo does not have access to. A wrong
guess at the truncation would not throw; it would silently produce a key that decrypts to
garbage, corrupting every stored email with no error raised anywhere in the pipeline.

| Impact | Cannot decrypt real production email data until the truncation algorithm is sourced (from the Bloom jar, or reverse-engineered and verified against known plaintext) |
|---|---|
| Status | Open, deliberate — do not guess at the truncation and ship it. A silent wrong answer is worse than an explicit stub |

## apps/api

| Item | Evidence | Impact | Status |
|---|---|---|---|
| **348 of 628** `.ts` files carry `@ts-nocheck` (re-verified this pass; prior pass's 387/573 no longer applies post-merge) | `grep -rl "@ts-nocheck" apps/api/src \| wc -l` → 348; `find apps/api/src -name "*.ts" \| wc -l` → 628 | Type errors in ~55% of the API are silently suppressed. `pnpm typecheck` passing 6/6 (verified below) is not evidence these files are type-safe. This is not academic: the boot-breaking bug fixed today (item 1 in "Fixed") was **four broken imports concealed by `@ts-nocheck` in files that otherwise passed every gate** — one day, one category of bug, found only by actually running the server | Open |
| 52 spec files / 335 tests (330 unit + 4 integration + 1 gated skip) for 628 `.ts` files, up from 2 test files at the start of the day | See `docs/TESTING.md` for the full breakdown | Real regression protection now exists on validators/mappers/sanitizers/services touched today; large swaths of controllers and untouched business logic remain uncovered | Open, much improved |
| `request-id.middleware.ts` exists but is never registered | `grep -n "request-id\|configure(" apps/api/src/app.module.ts` → no matches | Request IDs are not attached to any real request; the root `CLAUDE.md` observability invariant is unmet even though the building block is built | Open, unchanged |
| `main.ts` deliberately stamps `additionalProperties: true` onto the OpenAPI doc | `apps/api/src/main.ts` — post-processes the generated Swagger doc to widen every request/response schema | The published API contract is untyped by design | Open — deliberate stopgap, not an oversight |
| Several modules are empty shells | `apps/api/src/proxy/proxy.module.ts` is `@Module({})` | The strangler-fig proxy mechanism described in the root `CLAUDE.md` doesn't exist yet | Open, unchanged |
| Committed dev scripts and test-credential doc at `apps/api/` root | `seed_dev_user.js`, `simple_seed.js`, `simple_test.js`, `test_auth.js`, `test_auth_complete.js`, `SOLUTION.md` (documents `test@example.com` / `password123`) | Dev debris in the shipped tree | Open, unverified this pass whether still present — re-check |
| Several cross-domain ports still bound to null/dummy implementations | `SIZE_PROFILE_OPTION_PORT`, `FINISH_PROFILE_ITEM_PORT`, `EMAIL_ENCODER_PORT` (see above, deliberate), plus Badge/VolumeDiscount/MadeToOrder/CustomSize/Size/Finish/Fabric/ImageGallerySeo profile ports | These commerce sub-flows silently no-op or return null rather than fail loudly | Open |

## Storefront

| Item | Evidence | Impact | Status |
|---|---|---|---|
| No `/checkout` route at all | `find apps/storefront/src/app -iname "*checkout*"` → zero files | The storefront cannot complete a purchase | Open — highest-priority gap in the storefront |
| Still missing ~half the legacy route surface | 30 routes here vs 61 in the legacy `fabric` storefront: `/wishlist`, `/review`, `/fabric-wholesaler[/:city]`, 6 `/b2b/*` PSEO pages, 3 `/ads/*` pages | Roughly half the legacy route surface isn't rebuilt yet | Open |
| `dummy-data.ts` backs 9 of 10 profile routes | `apps/storefront/src/lib/profile/dummy-data.ts`, imported across order/thank-you/wholesale-program/order/notification-settings/custom-order/address/dashboard/account. The profile envelope-unwrap bug (item 3 in "Fixed") is now fixed, but that changes what the *live* fetch returns — it does not remove the dummy-data fallback for the pages that never had a live fetch to begin with | Order-detail, thank-you, custom-order-detail, address, account, notification-settings render fabricated data with no live fetch at all; dashboard and order-list fall back to dummy data silently on fetch failure | Open |
| `packages/ui` is empty despite being mandated | `packages/ui/src/index.ts` is `export {};` | Every page hand-rolls markup; no shared design-system primitives exist | Open |
| `src/lib/api.ts` has zero importers | Real fetch path is `src/lib/api/{client,repositories,adapters}` | Following the documented convention leads an agent to dead code | Open |
| 0 of ~50 fetch sites are Zod-validated | 1 unused schema total in `packages/types` (now 2 tests on it — see `docs/TESTING.md`) | No runtime contract checking anywhere in the storefront | Open |

## CMS

| Item | Evidence | Impact | Status |
|---|---|---|---|
| ~19 routes render fabricated data instead of calling their service (up from the ~15 counted in the prior pass — not re-fixed, just a wider recount) | `/diagnostics/host`, `/diagnostics/thread-dump`, `/diagnostics/application`, `/image-optimization/{attention,ledger,tools,history,queue}`, `/manage-workflow/{process,custom-process,artisan-payments,feedback,custom-feedback,template/add,template/update/[id]}`, `/view/[id]`, `/ai-embeddings`, `/manage-product/custom-product`, `/user/cart/[uid]` | These screens look functional in a demo but do not read or write real data | Open. `workflow-service.ts` already implements several of the needed reads — some of these pages just don't call it |
| `uploadReviewImage` is likely broken | Sets `Content-Type: multipart/form-data` manually on a `FormData` body, so no `boundary` is generated | Multipart parsing fails server-side | Open — not part of the six fixed bugs |
| `unwrapResponseData` picks arbitrarily on multi-array responses | First key in `Object.keys()` order wins, no name-based tie-break | Every CMS route passes through this function; a second array field added upstream silently misroutes | Open |
| `hasValidJWT()` ignores expiry | Only checks the string is non-empty; `isTokenExpired()` exists and is correct but has zero callers | An expired token reads as valid client-side | Open |
| No server-side auth guard | No `middleware.ts` anywhere in `apps/cms`; the only gate is a post-mount `useEffect` | Protected page code and its fetches run before any redirect fires | Open, security-adjacent |
| JWT in localStorage, five obfuscated chunk keys | `apps/cms/src/lib/auth-service.ts` | Token theft via XSS not mitigated by chunking (obfuscation, not security) | Open |
| `ConfigurationService` bakes `process.env` at module load | `apps/cms/src/lib/config.ts` — hardcoded fallbacks to `https://loom-v2.anuprerna.com` | Not reconfigurable per test/environment without a full module reload | Open |
| `FAKE_API`, `BYPASS_AUTH`, `MAINTENANCE_MODE`, `SECURE_CONNECT` dead flags | 0 references outside `lib/config.ts` | Dead configuration surface that looks load-bearing but isn't | Open |

## Security — read this section first if triaging

| Item | Evidence | Impact | Status |
|---|---|---|---|
| Live production token hardcoded in source, committed and pushed | `LOOM_TABLE_EXPLORER_TOKEN`, a 128-char token, in git history | A committed, still-live credential **cannot be rotated** (shared credential) | **Open — cannot be rotated. Repo is private, which is the whole mitigation** |
| Both `/api/backend` proxies spoof `Origin`/`Referer` to defeat backend CORS | Storefront → `http://localhost:4200`; CMS → `https://weave.bloomscorp.com` | The proxies exist specifically to bypass the legacy backend's CORS allowlist | Open, structural — necessary until `apps/api` is the system of record |
| CMS proxy sets `Access-Control-Allow-Origin: *` | `apps/cms/src/app/api/backend/[...path]/route.ts` | Wildcard CORS on a relay that forwards `Authorization` bearer tokens | Open |
| CMS proxy hardcodes `TARGET_HOST` | No env override | Cannot point CMS at staging/local backend without editing source | Open |
| JWT in localStorage, both apps | Storefront's `auth.store.ts` uses `zustand/persist` + `document.cookie` with no `HttpOnly`/`Secure` flags | Standard XSS-exfiltration exposure for session tokens | Open |
| Payments have no signature verification and no SDK | See Payments section above | A client can fabricate a payment success today; and the provider integration doesn't exist to even attempt a real one | Open |

## Docs / infra

| Item | Evidence | Impact | Status |
|---|---|---|---|
| CI now exists and is green | `.github/workflows/ci.yml` — `verify` job (lint → typecheck → test with coverage → build) plus a separate `integration` job against real Postgres, and a gitleaks secret scan | Was previously "no CI, green only because someone ran it by hand" — no longer true | **Resolved.** Re-verified this pass: lint 3/3, typecheck 6/6, test 6/6, build 5/5, all cache-hit clean |
| `packages/config` has zero consumers | `grep -rl "@anuprerna/config"` across every `package.json` → only itself | A shared-config package exists but nothing shares it | Open, unverified this pass — re-check |
| Lint config inconsistent across workspaces | `apps/api`/`apps/cms` on ESLint 9 flat config; `apps/storefront` on legacy `.eslintrc.json` | `pnpm lint` behaves differently per workspace | Open, unverified this pass — re-check |
| The frontends still point at legacy `loom-v2.anuprerna.com` | See "0% of production traffic" section above | No cutover has begun | Open |

## Corrections made during this verification pass

- Total test count is **589 across the repo's four workspaces** per the brief this pass started
  from, but the measured figure via `pnpm test:coverage` (the actual CI gate) is **588** — `api`
  330 + `cms` 93 + `storefront` 163 + `types` 2. Including `apps/api`'s separate integration suite
  (`pnpm test:int`, 4 passing + 1 gated skip requiring `RUN_SECRET_TESTS=1` against real prod
  data) brings the full repo-wide figure to **593**. Earlier revisions citing 497 or 551 are both
  stale — see `docs/TESTING.md` for the full breakdown.
- Controller count is **117**, not 116 as the prior pass had it (one more real controller landed
  since).
- `apps/api` is now **628** `.ts` files (`apps/api/src`), with **348** carrying `@ts-nocheck` —
  both figures changed substantially from the prior pass's 573/387 because of the merge.
- Schema is **117 tables / 45 enums**, matching production exactly as of a 2026-08-12 read-only
  re-introspection — corrects the prior pass's 116/68 (68 included 23 phantom enum twins).
- "Orphaned rich controllers, with thin generic ones wired in their place" is carried forward
  unverified — it was not re-checked this pass and may be stale.
- `apps/api` dev-debris files (`seed_dev_user.js` etc.) and `packages/config`/lint-consistency
  items were not re-verified this pass; carried forward from the prior audit as-is.

## Verified 2026-08-12 (late pass) — four items re-checked rather than carried forward

Earlier revisions of this file carried these forward unverified. They have now been measured.

### CMS routes rendering fabricated or placeholder data: **19**, enumerated

Previously quoted as "~15" and then "~19". The exact list, confirmed by checking each `page.tsx`
for any service call, `useEffect` or `apiClient` use:

| Route | Note |
|---|---|
| `ai-embeddings` | |
| `diagnostics/application` | |
| `diagnostics/host` | |
| `diagnostics/thread-dump` | Hardcodes a fake Java stack trace, including `OrderService.processOrder(OrderService.java:142)` |
| `image-optimization/attention` | |
| `image-optimization/history` | |
| `image-optimization/ledger` | |
| `image-optimization/queue` | |
| `image-optimization/tools` | |
| `manage-product/custom-product` | |
| `manage-workflow/artisan-payments` | Service method exists and is uncalled |
| `manage-workflow/custom-feedback` | |
| `manage-workflow/custom-process` | Service method exists and is uncalled |
| `manage-workflow/feedback` | Service method exists and is uncalled |
| `manage-workflow/process` | Service method exists and is uncalled |
| `manage-workflow/template/add` | Form has no submit handler |
| `manage-workflow/template/update/[id]` | |
| `manage-workflow/template/view/[id]` | |
| `user/cart/[uid]` | |

A methodology note worth keeping, because it nearly produced a wrong number: an automated scan
first classified `diagnostics/thread-dump` as wired, because the fabricated stack trace contains
the literal `OrderService.` and matched a naive service-call grep. **The fake data defeated the
detector for the fake data.** Anything counting these routes must inspect content, not just
grep for a call pattern.

Nine of 96 CMS routes are legitimately static — `login`, `dashboard`, and navigation hub pages
such as `logistic`, `manage-content`, `manage-whatsapp`, `manage-workflow`. Those are not
fabrications and are excluded from the 19.

### Orphaned controllers: **16 of 117** — confirmed still open

Verified by checking every `*.controller.ts` for a reference from any `*.module.ts`:
101 referenced, 16 orphaned. `commerce/order/controller/custom-order.controller.ts`,
`order-fulfillment`, `order-feedback`, `content/content.controller.ts`,
`product-api`, `cart-api`, `catalog-item-api`, three `profile/` controllers, three
`workflow/` element controllers, and `sku-group`, `tag`, `special-status`.

### `apps/api` dev debris: **resolved** — this entry was stale

`seed_dev_user.js`, `simple_seed.js`, `simple_test.js`, `test_auth.js`, `test_auth_complete.js`,
`SOLUTION.md` (which documented test credentials), root `TODO.md` / `MIGRATION_CHECKPOINT.md`, and
the stray root `custom product/` directory were all removed earlier on 2026-08-12. Verified absent.
`TODO.md` and `MIGRATION_CHECKPOINT.md` were preserved as `apps/api/docs/` with provenance banners.

### `packages/config` has zero consumers: **confirmed still open**

The only reference to `@anuprerna/config` anywhere is inside its own `eslint.base.mjs` comment.
No `package.json` depends on it; `apps/api/eslint.config.mjs` hand-mirrors its content instead of
importing it. Still a candidate for deletion.

