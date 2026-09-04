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
| 1 | **`TransactionStatus` was a numeric enum** (`PAID = 2`, etc.) written into a Postgres **string** enum column. Every transaction-status write would have been rejected outright by Postgres at runtime. | Commit `91cbd74` / `659250a` era work — corrected to string values matching the DB enum | `stripe-payment.service.spec.ts` and `razorpay-payment.service.ts` now use the string values |
| 2 | **Auth was broken for all password accounts.** `gatekeeper.service.ts` used scrypt; the legacy Java system uses `bcrypt(pepper + password)` at cost 11. The mismatch would have locked out all 3,784 password accounts on cutover. | Commit `659250a`, per `documentation/bmx-nverse.md:895-904` and `NVerseLaunchSequence1.java:141-159` | Confirmed against real production hashes: all 7,254 accounts are `$2a$11$…`, 60 chars. Split 3,784 BASIC / 3,390 GOOGLE / 80 UNKNOWN |
| 3 | **S3 uploads silently did nothing.** Category, segment and sub-category bound their storage ports to dummy adapters returning `""` while a real `ImageService` sat unused. | Commit `659250a` — all three now delegate to `ImageService` via `useFactory` adapters | `grep -rl ImageService` shows `category.module.ts`, `segment.module.ts`, `subcategory.module.ts` now import it |
| 4 | **Six live customer-facing bugs**, all "falsy zero" or fabrication bugs: delivery-charge overcharge on free shipping, out-of-stock shown as in stock, free items (`unitPrice`/`totalPrice: 0`) repriced, the profile envelope (`{success, addressList: [...]}`) never unwrapped so `.map()` threw, CMS reporting a failed settings save as successful, and CMS services fabricating data (including a fake `{success: true}`) on backend failure. | Commit `659250a` | Tests now assert **correct** behaviour instead of pinning the bug — see `docs/TESTING.md` |
| 5 | **The PLP discount calculation** was removed in commit `9361c3b`. | Commit `10aaae7` | Restored |
| 6 | **No CI existed.** Nothing enforced lint/typecheck/test/build staying green on a PR. | `.github/workflows/ci.yml` added | Two jobs: `verify` (lint → typecheck → test with coverage → build) and a separate `integration` job against a real `pgvector/pgvector:pg16` Postgres. A gitleaks secret scan also runs. Green on `main` as of this pass — verified by re-running all four gates locally: lint 3/3, typecheck 6/6, test 6/6, build 5/5 |
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
| 3 | Profile repository returned the raw envelope instead of unwrapping it | `apps/storefront/src/lib/api/repositories/profile.repository.ts` — **partially: this covered `getAddressList`/`getOrderList` only. `getCustomerProfile` was still reading the raw body and was fixed in the auth pass below** |
| 4 | Free items (`unitPrice`/`totalPrice: 0`) got repriced by the same falsy-zero class of bug | storefront cart/catalog adapters |
| 5 | CMS reported a failed settings save as successful | `apps/cms/src/services/settings-service.ts` |
| 6 | CMS fabricated data on backend failure, including `createShipment` returning a fake success | `apps/cms/src/services/settings-service.ts`, `logistic-service.ts` |

Two items from the prior pass remain open and are **not** part of the fixed six — see the CMS
section below: `uploadReviewImage`'s missing multipart boundary, and (until its deletion) `unwrapResponseData`'s
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

**Update 2026-08-12.** The storefront's Google path was not merely unverified, it was
structurally incapable of working, and has now been rebuilt. It used `@react-oauth/google` and
posted a Google **access token** to `/authenticate/social` under the literal username
`"google_user"`. Loom's `NverseAuthenticationController` calls
`Auth0Service.validateToken(token, username)` — it wants the raw **Auth0 ID token** and the
tenant's real email, exactly as fabric sends via `@auth0/auth0-angular`. No Google-issued token
can ever satisfy that check, and no such tenant as `google_user` exists.
`AuthContainer` now brokers through `@auth0/auth0-react`
(`loginWithPopup({connection: 'google-oauth2'})` → `getIdTokenClaims().__raw`), verifies the
tenant, registers it if new, then authenticates — fabric's flow.

The gap this section describes is *narrowed, not closed*: the code is now the right shape, but
still unexercised against a real Google account. The remaining prerequisite is environmental —
the serving origin (`http://localhost:4200` for local dev) must be listed in the Auth0
application's **Allowed Web Origins** and **Allowed Callback URLs**. Until someone confirms that,
the popup will fail at Auth0 before it ever reaches Loom.

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
| ~~Several cross-domain ports still bound to null/dummy implementations~~ | Was: `SIZE_PROFILE_OPTION_PORT`, `FINISH_PROFILE_ITEM_PORT`, plus Badge/VolumeDiscount/MadeToOrder/CustomSize/Size/Finish/Fabric/ImageGallerySeo profile ports | **Resolved** — all ~30 `async () => null` providers across `auth`, `cart`, `review`, `product`, `fabric-product`, `finished-product`, `product-preview`, `sub-category` and `product-size-profile` are now bound to the owning module's service or to a real select-by-id over the owning table (`commerce/shared/db-lookup.ts`). Guarded by `apps/api/src/commerce/cross-module-ports.spec.ts`, which fails the build if any module re-introduces an `async () => null\|false\|[]` provider | Closed. `EMAIL_ENCODER_PORT` remains the one deliberate exception (see above); the three genuinely-unimplemented ports are in the section below |

## Ports that now fail loudly instead of silently returning nothing

Three cross-module dependencies genuinely have no implementation in `apps/api`. Rather than
leave them as `async () => null` providers — which answered 200 with the data quietly missing —
each is now wired to throw, or to a caller that already treats the result as a failure.

| Port | Where | Why it can't be wired yet | What it does now |
|---|---|---|---|
| `ZOHO_ADAPTER_PORT` (`add/update/reTrigger` × fabric + finished product) | `commerce/product/fabric-product/fabric-product.module.ts`, `commerce/product/finished-product/finished-product.module.ts` | No Loom-product-to-Zoho-item mapping exists. `ZohoService.syncItem` needs a `ZohoItemPayload` nothing in the repo constructs, and `triggerFabricProductWorkflow`/`triggerFinishedProductWorkflow` only write a log line and return `true` | Throws `NotImplementedException` naming the port and this document. Previously a no-op, which would have left the Zoho catalogue permanently stale behind a 200 |
| `CUSTOM_ORDER_ITEM_PORT.updateCustomProductReference` | `commerce/product/custom-product/custom-product.module.ts` | No CustomOrderItem module exists; source's `CustomOrderItemDAOController` has no counterpart | Returns `ActionCode.UPDATE_FAILURE`, which makes `CustomProductService.updateCustomProduct` throw `CustomProductOrderItemSyncError` — the same signal source raises when the sync fails. `SYNC_ERROR_LOGGER_PORT` now writes a real error log rather than swallowing it |
| `AUTH0_VALIDATION_PORT` — *configuration*, not implementation | `auth/auth.module.ts` → `auth/service/auth0-validation.service.ts` | Now a real `jose` JWKS verifier (RS256 + issuer + `email` claim, matching `Auth0Service.java`). It needs `AUTH0_ISSUER` set | Throws `ServiceUnavailableException` when `AUTH0_ISSUER` is unset. It no longer answers `false` for a config problem — a token validator stuck on one answer is indistinguishable from a broken one. See the Google OAuth section above: this removes the "bound to a dummy that always rejects" half of that gap; the flow is still unexercised against a real account |

## `commerce/profile` controllers are dead code that collides with live routes

`ProfileModule` was never imported by any other module, so its four controllers had never been
reachable. Two problems surfaced when the product modules began depending on `ProfileService`:
`tenant-profile.controller.ts` references an unimported `Post` decorator and throws at import
time, and every route the four controllers declare is already served by
`commerce/tenant/controller/tenant.controller.ts` and `commerce/domain/*.controller.ts`.

`ProfileModule` is therefore now **providers-only** (`ProfileService`, `ProfileRepository`), with
the controllers left on disk unregistered.

| Impact | None today — the routes were unreachable before and are unreachable now |
|---|---|
| Status | Open. Someone needs to reconcile the duplicate profile-route surface and either delete these controllers or retire the `tenant`/`domain` ones |

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
| `unwrapResponseData` picks arbitrarily on multi-array responses | First key in `Object.keys()` order wins, no name-based tie-break | Was "every CMS route passes through this function" — untrue since `src/services/` was deleted, after which it had zero importers | **Resolved by deletion 2026-09-02** — `src/lib/api-helper.ts` and its 18 tests are gone. See the CMS section at the end of this document |
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


## Storefront authentication: four defects, all verified against live Loom and fixed (2026-08-12)

The reported symptom was "I can't log in locally, they changed a header". The header change was
real but is **not** the cause: `X-Loom-Table-Explorer-Token` and
`X-Loom-Tenant-Decrypt-Fingerprint` were already handled by
`apps/storefront/src/app/api/backend/[...path]/route.ts`, the rotated token is already in
`.env.local`, and none of `/check-email/tenant`, `/authenticate/email` or `/customer/registration/*`
require the table-explorer token at all — verified by calling them with and without it.

The real causes were four independent contract mismatches between the storefront and Loom, each
confirmed by probing `https://loom-v2.anuprerna.com` through the local proxy, not by reading:

| # | Defect | Evidence | Fix |
|---|---|---|---|
| 1 | `checkEmailTenant` read `registered` off the top level | Loom returns `{"entity":{"registered":true,"emailVerified":false},"success":true}` (`RainTree.postEntityCustomResponseUnauthorized`) | Unwrap `entity`. This was the login-blocker: `registered` was always `undefined`, so **every existing customer was routed to the signup form instead of the password form** |
| 2 | `registerCustomer` POSTed a flat body to `/customer/registration` | That path 404s — Loom only maps `/customer/registration/email`. A flat body there returns 406 "A minion wasn't in the right place at the right time. [NPX]" because the controller binds a `Customer` whose tenant fields sit under `tenant` | Correct path, `{tenant:{name,email,password,emailVerified,provider,gender}}`, matching fabric's `_mapRegisterData`. Loom stores one `name`, not first/last |
| 3 | Registration expected a JWT back and auto-logged the user in | The endpoint returns a RainTree ack (`{success,message}`) only; the customer must verify their email and then log in | Show the verify-your-email panel; do not fabricate a session |
| 4 | `getCustomerProfile` read profile fields off the top level | Loom returns `{success,message,customer:{tenant:{uid,name,email,contactNumber,…}}}` | Flatten `customer.tenant`; split `name` into first/last. Previously the store held an all-`undefined` user after a *successful* login |

Google is covered in "The Google OAuth path has never been verified" above — it was rebuilt onto
Auth0 in the same pass, and its one remaining prerequisite is an Auth0 dashboard setting, not code.

**Verification.** Registered, checked, authenticated and fetched the profile for a throwaway
tenant end-to-end through `http://localhost:4200/api/backend` against live Loom, plus 164/164
storefront unit tests and a clean `tsc --noEmit`. The repository tests previously *encoded* the
wrong shapes — their MSW handlers asserted the invented envelopes rather than Loom's real ones,
so they passed while production was broken. They now assert the observed responses.

**Two throwaway tenants were created in the live Loom database during this verification:**
`probe-x1@example.com` and `probe-x2@example.com` (password `Passw0rd!23`, unverified email,
`BASIC` provider). Delete them when convenient.

## The custom-made family — closed in the 2026-09-02 deferred-vertical pass

Context: `node scripts/route-coverage.mjs` measures the NestJS API against the 694 routes of the
Java Loom app. An earlier pass on 2026-09-02 closed the four families with confirmed live frontend
callers and **deliberately deferred 15 custom-made routes, stubbing nothing** — the entry that
stood here listed them. A second pass has now implemented 11 of the 15. The section below is
rewritten to record what landed and what remains, rather than deleted.

Coverage moved **637/694 (91.8%) -> 649/694 (93.5%)**; the `custom-made` MISSING family went
**15 -> 4**.

### Implemented

| Method | Path | Gate | Java original |
|---|---|---|---|
| POST | `/add/custom-workflow` | CODE_SU | `CustomWorkflowDAOController.addWorkflow` |
| PATCH | `/update/custom-workflow` | CODE_SU | `CustomWorkflowDAOController.updateWorkflow` |
| GET | `/get/artisan/custom-workflow-list/{status}` | CODE_AR | `findAllCustomWorkflowsByArtisan` |
| GET | `/get/custom-order/{orderId}/workflow-list` | CODE_SU | `findCustomWorkflowSummariesByOrderId` |
| GET | `/get/custom-order/{orderId}/workflow/{orderItemId}` | CODE_CU | `getOrderwiseWorkflow` |
| POST | `/trigger/impact/custom-order/{customOrderId}` | CODE_SU | `CustomImpactFactorDAOController.calculateCustomOrderImpact` |
| GET | `/get/custom-size-profile-list` | CODE_SU | `CustomSizeProfileController.getCustomSizeProfileList` |
| GET | `/get/custom-size-profile/{profileId}` | CODE_SU | `.getCustomSizeProfile` |
| POST | `/add/custom-size-profile` | CODE_SU | `.createNewCustomSizeProfile` |
| PATCH | `/update/custom-size-profile` | CODE_SU | `.updateCustomSizeProfile` |
| DELETE | `/delete/custom-size-profile/{profileId}` | CODE_SU | `.deleteCustomSizeProfile` |

Notes that matter for anyone reading the new code:

- **`ImpactAssumptions` now has a port** (`commerce/impact/dto/impact-assumptions.ts`), read from
  the `IMPACT_ASSUMPTIONS` settings row with Loom's full validity check (version > 0, non-negative
  CO2/water rates, percentages as decimal fractions in [0,1]). It has **no default**: an absent or
  incomplete configuration makes the engine write nothing and report
  `IMPACT_ASSUMPTIONS_NOT_CONFIGURED` for every order item, as Loom does. The read route
  `GET /get/impact/custom-order/{id}` now also sets `configurationError` in that case — it did not
  before, so stale rows were rendered as current.
- **The impact calculation is Loom's, not an approximation.** FABRIC: `fabricMeters = quantity`,
  `co2OffsetKg = quantity x co2PerMeter`, `waterSavedLitres = quantity x waterPerMeter`,
  `artisanHours = totalWorkHours = quantity x workflow.avgArtisanWorkHoursPerMeter`,
  `womenArtisanHours = totalWorkHours x womenArtisanWorkPercentage`, `stitchingHours = 0`.
  APPAREL: `totalWorkHours = stitchingHours = quantity x workflow.avgWorkHoursPerProduct`,
  `womenStitchingHours = totalWorkHours x womenStitchingWorkPercentage`, and **no environmental
  metrics at all** (Loom calls `applyEnvironmentalMetrics` only from the fabric branch). A missing
  workflow or a missing rate yields a PARTIAL row naming the missing input, never a substituted
  constant. Swatch fabric items are excluded and any stale row for them is deleted.
- **The workflow status state machine is explicit** (`commerce/custom-workflow/dto/workflow-status.machine.ts`).
  Loom sets any non-CREATED status and silently drops CREATED; this port keeps the same legal set
  (`{CREATED,INITIATED,HALTED,COMPLETED} -> {INITIATED,HALTED,COMPLETED}`, and `CREATED -> CREATED`
  as a no-op) but **400s** a request that asks to move a running workflow back to CREATED instead
  of returning 200 having done nothing.
- **Both writes are transactional.** `addCustomWorkflow` cascades workflow -> element + step_element
  -> element + subprocess_element -> `workflow_custom_order_mapping` in one transaction; Loom
  returns only the MAPPING's action code, so a workflow without its mapping is not a success, and
  here it cannot commit at all. `updateCustomWorkflow` validates the base-pay conflict, synchronizes
  the artisan assignments and updates the row in one transaction.
- Both writes then recalculate the custom order's impact, reproducing Loom's
  `publishCustomImpactRefresh`. The refresh runs after the write commits and a failure is logged,
  not escalated into a false write failure.

### Still absent, and why — none of these are stubbed

**They do not exist; calling them 404s. Do not add a placeholder.**

> `GET /get/custom-workflow/{workflowId}` was on this list and is now **ported**
> (`CustomWorkflowController.getCustomWorkflow`, key `workflow`, CODE_SU).
> `populateWorkflowArtisanAssignments` turned out to be exactly a projection of
> `workflow_artisan_mapping`, so it is part of the query rather than a missing
> service. `populateArtisanPaymentStatus` is NOT part of Loom's
> `CustomWorkflowDAOController.retrieveWorkflow` at all, so each assignment ships
> without `basePayStatus` — a key the CMS already types as optional — rather than
> with a guessed one.

| Method | Path | Java method | Why still absent |
|---|---|---|---|
| GET | `/get/custom-workflow/element/feedback` | `ElementFeedbackController.retrieveCustomWorkflowElementFeedbackList` | Lives on `ElementFeedbackController` in `commerce/workflow/`, outside this pass's ownership, and needs `findCustomWorkflowElementFeedbackByStatus` plus the email decoder (still a dummy — see the email-encryption section). |
| GET | `/get/data-dump/custom-order` | `CustomOrderController` | `commerce/domain/custom-order*` was owned by another agent during this pass. No frontend caller; the CMS uses `/get/super-user/custom-order-list`. |
| GET | `/get/data-dump/custom-order-item` | `CustomOrderController` | As above. |

### One live route that now refuses a transition rather than half-performing it

`PATCH /update/custom-workflow` throws `NotImplementedException` on the transition **into**
`COMPLETED`. Loom's `previousStatus != COMPLETED && status == COMPLETED` edge calls
`ArtisanPaymentRecordDAOController.calculateForWorkflow(workflowId)`, a 397-line payment engine that
has no counterpart in `apps/api` (`commerce/artisanpayment/` is CRUD only, no `calculateForWorkflow`).
Accepting the transition would mark a workflow done and never pay the artisans for it, which is the
silent-data-loss failure mode this codebase has been removing. Every other transition is fully
implemented, and re-saving an already-COMPLETED workflow is allowed (Loom does not re-run the
payment calculation there either). Porting `calculateForWorkflow` into `commerce/artisanpayment/`
lifts the refusal — that is the whole remaining work.

### A discrepancy worth recording: `steps` on update

`apps/cms/src/lib/workflow-ops.ts` records a measurement that `PATCH /update/custom-workflow`
`{ steps }` "PERSISTS (verbatim)". That was measured against the deployed **anuprerna-backend**
sandbox wrapper (its own note names `anuprerna-backend workflow.mapper.ts`), not against Loom.
Loom's `CustomWorkflowDAOController.updateWorkflow` copies name, description, note, status, the
artisan assignments and the planning metrics — **it never touches `steps`**. This port follows the
Java. If the CMS depends on a step rewrite through this route, that is a behaviour the Node wrapper
added and it needs its own decision, not a silent re-introduction here.

### Also found, not fixed (outside the pass's ownership)

- `apps/api/src/commerce/domain/order-migrated.controller.ts` — `get_get_customer_order_list_v2`
  and `get_get_customer_order_list_all` are undecorated methods (so unrouted) that
  `SELECT ... FROM product LIMIT 50` and return it under a `data` key as if it were an order list.
  Dead, and misleading to read. The real routes now live on
  `commerce/order/controller/order.controller.ts`.
- `apps/api/src/commerce/workflow/controller/workflow.controller.ts` answers every route with the
  key `data`, where Loom uses `workflowList` / `workflow`. The CMS reads Loom's keys
  (`pickArray(j, "workflowList")`), so the standard-order workflow list is very likely broken in
  the same way forex was. Not touched here — different owner — but it should be checked.
- `apps/api/src/commerce/order/service/order.service.ts` previously exposed
  `getProcessingOrders(customerId)`, which ignored `customerId` and returned every tenant's orders.
  It had no callers and was replaced by the tenant-scoped `getProcessingOrderStatus`.

## Storefront — 2026-09-02 documentation + test-gap pass

Found while writing `apps/storefront/docs/` and filling the test gaps on
`fix/flax-audit-remediation`. Everything below was read in the code, not inferred. Two stale rows in
the "## Storefront" table above are corrected first.

### Corrections to the Storefront table above

| Stale claim | Reality on this branch |
|---|---|
| "No `/checkout` route at all — the storefront cannot complete a purchase" | Wrong now. `apps/storefront/src/app/checkout/page.tsx` exists and a four-step server-side checkout is wired: `/api/checkout/order` → `/api/checkout/payment-session` → the gateway → `/api/checkout/payment-callback`, with a sandbox gateway stand-in. See `apps/storefront/docs/cart-and-checkout.md`. Whether it completes against a *real* gateway is untested and unverified — the six Loom gateway action routes are still blocked by the write-guard |
| "Still missing ~half the legacy route surface (30 routes)" | Undercounted. `find apps/storefront/src/app -name page.tsx` now returns 73, including `/wishlist`, `/review`, `/fabric-wholesaler[/[city]]`, the six `/b2b/*` PSEO pages and `/ads/[slug]` — all named as missing in that row. How much of the legacy surface is still absent was not re-measured in this pass |
| "`dummy-data.ts` backs 9 of 10 profile routes" | The file is gone: `apps/storefront/src/lib/profile/dummy-data.ts` does not exist. Whether every profile page now has a live fetch was **not** verified in this pass — do not read this correction as "the profile pages are done" |

### New items

| # | Item | Evidence | Impact | Status |
|---|---|---|---|---|
| 1 | **Passwordless login is single-instance-only and breaks on every deploy.** The OTP store is a plain `Map` hung off the Node `global` — no file, no database, no cache | `apps/storefront/src/lib/auth/otp-store.ts` (12 lines, re-read and confirmed 2026-09-02) | Stated plainly: **every outstanding sign-in code is lost on any restart or redeploy**, and **a code issued by one instance cannot be read by another**. On Vercel, where requests may land on different lambdas and lambdas are recycled freely, a buyer can request a code and then find it rejected through no fault of their own. The passwordless lane is not safe to rely on in production as built | Open — **not fixed here.** A durable store is a backend decision (the backend already owns `relational.email_signin_code`), not a storefront one |
| 2 | **`isWrapperToken`'s comment describes a check it does not perform.** The comment says it requires cleartext `customerId` and `roles` claims; the code only checks for three segments and a JSON-object payload | `apps/storefront/src/lib/loom/token.ts` | An agent reading the comment will believe stale/foreign tokens are filtered more tightly than they are. The genuine check is the HMAC + expiry in `verifyToken` | Open — comment, not behaviour |
| 3 | **The write-guard allowlist is duplicated in `.harness/zero-mutation-gate.mjs`** and must be edited in two places | `apps/storefront/src/lib/loom/client.ts` says so itself, repeatedly | Two hand-synced copies of a security allowlist will drift | Open, known, and now tested on the storefront side (`src/lib/loom/client.test.ts`) — the gate's copy is still untested |
| 4 | **Thirteen route handlers bypass both fetch wrappers**, building their own `fetch` from `env.NEXT_PUBLIC_SPRINGBOOT_API_URL` — `blogs`, `content/[blogId]`, `featured/[category]`, `navigation/{category,finish,story}/*`, `plp`, `plp/related`, `plp/segments`, `product`, `search`, `stories`, `stories/[storyId]` | `grep -rn NEXT_PUBLIC_SPRINGBOOT_API_URL apps/storefront/src/app` | Outside the demo write-guard and without Loom's required `Origin` header. All thirteen are GET-only today, so the write-guard gap is theoretical — nothing structural keeps it so. `apps/storefront/CLAUDE.md` says "ten"; the count is thirteen | Open |
| 5 | **`NEXT_PUBLIC_API_MODE=nest` breaks 10 tests and most of the app.** Only `catalog.repository` and `cart.repository.getCart` have real `nest` branches; five route handlers merely swap the base URL and assume both backends serve the same shape (unverified). Auth, checkout, profile and wishlist have no `nest` branch at all | Measured: `NEXT_PUBLIC_API_MODE=nest pnpm vitest run src/lib/api` → 10 failed / 84 passed | The flag reads like a switch and is not one. `legacy` is the only mode that works | Open |
| 6 | **`mergeGuestCartOnLogin` clears the guest cart even when every line failed to merge** | `apps/storefront/src/lib/guest-cart.ts` | Logging in during a backend outage silently loses the cart. Deliberate — the alternative is a double-add on the next login — but it is a silent data loss, not a neutral trade | Open, by design. Now pinned by a test so it cannot change unnoticed |
| 7 | **`cartRepository.getCart()` swallows a 401 and returns an empty cart** | `apps/storefront/src/lib/api/repositories/cart.repository.ts`; asserted in `cart.repository.test.ts` and `cart.store.test.ts` | An expired session is indistinguishable from an empty cart in `stores/cart.store.ts`. The `/api/cart/*` routes get this right (`401 { reauth: true }`); this second read path does not | Open |
| 8 | **`lib/pdp/pricing-engine.ts` is untested and typed `any` throughout** | `any` on every parameter; no `*.test.ts` beside it | It is the PDP price ladder — a money path — with no test and no types. Deliberately not tested: without the Angular `ProductInformationService` it was ported from, any test written now would pin the current output rather than the correct one | Open |
| 9 | **Eight `src/app/api/auth/*` routes have no tests and were not verified**: `register`, `forgot`, `reset-password`, `verify-email`, `resend-verification`, `check-email`, `email-code/request`, `email-code/verify` | `find src/app/api/auth -name '*.test.ts'` → `login`, `me`, `guest-checkout` only | `email-code/verify` mints session tokens with no backend involvement, and `check-email` is an existence probe on the sign-in surface. Neither has a test | Open |
| 10 | **`lib/checkout/checkout-calculations.ts` now has no callers at all.** Its only consumers were `CheckoutPage.tsx` and its eight children, deleted 2026-09-03. The live checkout prices shipping through `components/checkout/types.ts` → `shipmentCost()` instead | `grep -rn checkout-calculations apps/storefront/src` returns only its own spec | ~250 lines of unreferenced pricing code plus 18 specs. Kept deliberately: it is now the only *non-fabricating* checkout price helper in the codebase and a new checkout UI would want it, and the invented 110/1500 fallbacks are gone so it is no longer a landmine | Open — **delete it and its spec if nothing has picked it up.** Flagged rather than deleted because another agent is actively building checkout endpoints |
| 11 | **`loomTableExplorerToken()` is dead code** in the proxy — declared with a comment explaining why it exists, then never called; the handler reads `process.env.LOOM_TABLE_EXPLORER_TOKEN` inline instead | `apps/storefront/src/app/api/backend/[...path]/route.ts` | Harmless, but it is the second-most-read file on the strangler boundary and it reads as if the function were the sanctioned accessor | Open |

### Fixed in this pass

Ten defects, nearly all of the same shape: **the code answered a failure with a plausible-looking value
instead of admitting it had none.** That is the pattern this remediation exists to remove.

| # | Bug | Where | Fix |
|---|---|---|---|
| 1 | **`GET /api/checkout/shipment` fabricated shipping prices.** When both upstreams failed it answered `200 { success: true }` with a hardcoded `DEFAULT_SHIPMENT_LIST` — ₹200 express, ₹150 regular, ₹3000 international DDP. The caller could not distinguish it from a live quote, and the figure flowed into a real order total: a buyer could be quoted, and charged, a price no backend ever produced | `apps/storefront/src/app/api/checkout/shipment/route.ts` | The fallback list is **deleted**. The route now answers `502 { shipmentList: [], success: false, message }`, relaying the backend's own message (the `/api/profile/addresses` pattern). An empty list from a *reachable* backend is treated the same way — "no options" is not a state the checkout may proceed past. Both `CheckoutShell` load paths already threw on `!res.ok` and render the error panel with a Retry button, verified by reading them, so the checkout stops instead of proceeding on a made-up number. `route.test.ts` asserts none of the fabricated amounts or ids can appear on any failure path |
| 2 | **`checkoutRepository.getShipmentList()` carried the same defect twice over:** a hardcoded two-option fallback (₹110 / ₹200) on any failure, *and* per-field defaults written with `\|\|` — `Number(item.baseAmount) \|\| 110` overwrites a genuine `0`, the falsy-zero bug class already fixed twice in the cart adapters. A free-shipping option would have been silently charged ₹110 | `apps/storefront/src/lib/api/repositories/checkout.repository.ts` | Throws instead of fabricating; money fields read with `??` semantics so a real `0` survives; an option with no usable price is refused rather than defaulted. Its only caller is dead code (see "New items") and uses `Promise.allSettled`, so it shows no options rather than a wrong one. New `checkout.repository.test.ts` |
| 3 | **Session tokens never expired server-side.** `decodeTokenPayload` verified the HMAC and nothing else; the `exp` claim `email-code/verify` writes into every token it mints was read by no one. A wrapper-minted session — including a stolen one — was valid forever, bounded only by the cookie's client-side `maxAge` | `apps/storefront/src/lib/auth/token-helper.ts`, `apps/storefront/src/app/api/auth/me/route.ts` | Expiry is enforced **in the helper, where every caller routes through**, not at the call site. New `verifyToken()` checks the HMAC, then `exp` (`>=`, so a token expiring exactly now is dead), and reports `expired` separately from `invalid`; a signed token with a missing or non-numeric `exp` is rejected too — a session with no stated lifetime is the same defect. `decodeTokenPayload` is now a thin wrapper over it, so its existing callers inherit the check. `/api/auth/me` uses the `expired` reason to **tear the cookie down** (`clearedSession()`) rather than fall through to Loom and leave a dead cookie in the browser. 8 new tests across `token-helper.test.ts` and `me/route.test.ts` |
| 4 | **`calculateShippingCost` invented ₹110/₹1500 when it had no quote** — `shipment?.baseAmount ?? (isDomestic ? 110 : 1500)`, and the same for `baseQuantity` and `additionalAmount`. The figure reached the order total and, via `CheckoutPage`'s Razorpay branch (`Math.round(priceBreakdown.advancePay * 100)`), the amount actually charged. This was the third and last copy of the shipping fabrication, one layer below the two already removed | `apps/storefront/src/lib/checkout/checkout-calculations.ts` | `shipment` is now a **required** parameter, so the type system refuses the call — there is no way to ask for a cost without a quote. `calculateCheckoutPrices` keeps an optional shipment (the page renders before one is chosen) and returns an explicit `{ hasShippingQuote: false, shippingCost: null, total: null, advancePay: null, remainingBalance: null }`: `null`, not `0`, because "no quote" is not "free", and the shipping-dependent totals are withheld rather than understated. `CheckoutPriceSummary` renders "No quote available" and a `—` total; `handlePlaceOrder` refuses to submit and returns the buyer to the shipping step. 11 new tests |
| 5 | **Invented delivery estimates.** `Number(item.estimatedFromDay) \|\| (isInternational ? 7 : 5)` (and the matching `estimatedToDay`) fabricated a delivery window the backend never quoted — and, being `\|\|`, turned a genuine same-day `0` into 5 or 7 days. `calculateDeliveryTimestamp` compounded it with `daysOffset \|\| 0`, rendering a missing estimate as "arriving today"; `CheckoutPage` then posted `estimatedDeliveryFrom: estDeliveryFrom \|\| Date.now()`. The API's synthesized 7-day `/track/*` ETA was deleted for exactly this reason | `apps/storefront/src/lib/api/repositories/checkout.repository.ts`, `apps/storefront/src/lib/checkout/checkout-calculations.ts`, `apps/storefront/src/components/checkout/CheckoutPage.tsx` | `ShipmentOption.estimatedFromDay`/`estimatedToDay` and `AddOrderItem.estimatedDelivery*` are now optional; a missing estimate stays **absent** at every hop. `calculateDeliveryTimestamp(undefined)` returns `undefined` while still honouring a real `0` as same-day. 6 new tests |
| 6 | **Three dead free-shipping threshold constants** read like live business rules and were not one: `DOMESTIC_FREE_SHIPPING_THRESHOLD = 2000` and `INTERNATIONAL_FREE_SHIPPING_THRESHOLD = 50000` in `checkout-calculations.ts`, and `FREE_SHIPPING_THRESHOLD = 2000` in `legacy-cart.adapter.ts` | `grep` finds the declarations and no reads anywhere in the app | **All three deleted.** Recorded plainly: **no free-shipping threshold is enforced anywhere in this storefront.** The only free shipping that exists is the `isExplicitFreeShipping` flag a caller passes in, and a quote whose `baseAmount` is genuinely `0`. Whether Loom enforces a threshold server-side was **not verified** — it is a backend question and this pass did not read Loom's pricing code |
| 7 | **The cart added a frontend-invented ₹150 to every non-empty cart's total.** `mapLegacyCartToDomain` set `estimatedShipping = FLAT_SHIPPING_CHARGE` (150) and folded it into `Cart.total` — a flat rate ignoring quantity, destination and delivery method, none of which the cart knows. The existing spec asserted the `150`, i.e. it pinned the fabrication rather than a behaviour | `apps/storefront/src/lib/api/adapters/legacy-cart.adapter.ts:337` (was), `legacy-cart.adapter.test.ts` | `Cart.estimatedShipping` and `Cart.total` are now `number \| null`; a non-empty cart returns `null` for both, an empty one `0`/`0` (genuinely nothing to ship). `null`, not `0`, because `0` reads as "free". **Zero UI change was needed** — the cart drawer, the only cart UI (`/cart` redirects to `/checkout`), only ever rendered `subtotal`; it now also says "Shipping calculated at checkout". The nulls exist so nobody wires a fabricated total up later. The bug-pinning spec was rewritten to assert `null` and that no invented amount appears at any cart size |
| 8 | **`CheckoutPage.tsx` and its EIGHT exclusive children were dead code that computed payment amounts** — 2,463 lines that read as the checkout to anyone opening them, and the path where the invented ₹110/₹1500 would have reached Razorpay. The live `/checkout` renders `CheckoutShell` | Zero importers re-confirmed immediately before deletion; each of `CheckoutStepHeader`, `CheckoutItemsList`, `CheckoutAddressSection`, `CheckoutWhatsAppOptin`, `CheckoutPaymentMethods`, `CheckoutShipToAndMethod`, `CheckoutShipmentTier`, `CheckoutPriceSummary` had no importer but `CheckoutPage`, and the named exports `isPhoneValid` / `isPhoneMissingCountryCode` had no external consumer | All nine files deleted. (The brief said four children; there were eight.) No orphaned tests existed to remove. Typecheck, lint and build stay clean |
| 9 | **No free-shipping rule exists in either stack — now recorded so nobody re-adds one from memory.** Three dead frontend constants suggested otherwise | Read directly in `loom/src/main/java/com/bloomscorp/loom`: `DISCOUNT_TYPE.FREE_SHIPPING` (`discount/orm/DISCOUNT_TYPE.java:13`) is an enum constant **referenced by no other Java file**; no threshold constant exists; the `min_order_value` columns in `tenant/nativequery/CustomerNativeQuery.java` are the loyalty/wholesale minimum, unrelated to shipping | Closed as "no rule exists", not as "unverified". The only free shipping in the storefront is the `isExplicitFreeShipping` flag and a quote whose `baseAmount` is genuinely `0` |
| 10 | **`POST /api/profile/addresses` reported a refused address as saved.** The backend answers HTTP 200 with `{ success: false, message }` for a rejected address; the route ignored the body and always returned `{ success: true, message: 'Address saved successfully.' }`. Both callers check `res.ok && data?.success`, so the buyer saw a confirmation and got no address | `apps/storefront/src/app/api/profile/addresses/route.ts` | The route now relays the backend's verdict: `{ success: false }` → `400` with the backend's message. Pinned by `route.test.ts` |

> **A finding from the Loom read above that changes how bad the three shipping fabrications were.**
> **Live Loom does not price shipping at all.** `Orders.shippingCost` (`order/orm/Orders.java:136`)
> is a plain stored `Double` written from the request; `nverse/validator/OrdersValidator.java:69`
> only null-checks it, and the single line that would have defaulted it is commented out
> (`order/normalizer/OrdersNormalizer.java:23`). `getBaseAmount` / `getAdditionalAmount` /
> `getBaseQuantity` appear **only** in `ShipmentValidator` (are they > 0?) and
> `ShipmentDAOController` (the CMS editing the row) — there is no arithmetic on them anywhere in
> Loom. Loom stores shipment rows and hands them out; it never computes a charge from them.
>
> The reassurance written on `/api/checkout/order` — "the BACKEND recomputes subtotal from the line
> prices and prices shipping from the chosen shipment record; a client total is discarded there" —
> is true of the **sandbox wrapper's** `CheckoutController`, which is what `LOOM_BASE_URL` resolves
> to today. It is **not** true of live Loom. Against a live-Loom backend the client's shipping
> number *is* the charge, which makes the ₹110/₹1500, ₹150 and hardcoded-quote fabrications removed
> this week materially worse than "display only". Anyone cutting `LOOM_BASE_URL` back to live Loom
> needs to know this before trusting any client-side total. **Open, and not a storefront fix** —
> whether the backend should price shipping server-side is an `apps/api` decision.


---

## CMS re-verified on `fix/flax-audit-remediation` (2026-09-02)

This branch deleted `apps/cms/src/services/` (24 static-class service files) and replaced it with a
fetch-based `src/lib/*-api.ts` layer. **The 60 tests that covered the service layer went with it**,
leaving 33. That is the largest test regression in this repo's history and it happened silently,
because a deleted test cannot fail. A replacement suite now exists — `apps/cms` runs **206 tests
across 17 files**, weighted to the write paths.

Full write-ups: [`frontend/cms/data-layer.md`](./frontend/cms/data-layer.md) and
[`frontend/cms/auth-and-writes.md`](./frontend/cms/auth-and-writes.md).

### Fixed in this pass

| Item | Evidence | Fix |
|---|---|---|
| **Authentication bypass: `/api/auth/login` minted a valid session for ANY email and ANY password whenever `SANDBOX_ADMIN_TOKEN` was set** | `let token = process.env.SANDBOX_ADMIN_TOKEN` ran *before* the credential check and nothing cleared it when every auth endpoint refused; `middleware.ts` `tokenValid()` then accepted that exact value. Password auth was decorative — the same defect class as the `RolesGuard` bypass this remediation started from | **Restructured to fail closed.** The credential check (`POST /authenticate/email` against Loom) runs first and its *result* decides. The sandbox token is now an **additional** accepted credential and never a bypass: it requires `CMS_SANDBOX_LOGIN=true` **and** `NODE_ENV !== "production"` **and** a configured `CMS_SANDBOX_LOGIN_EMAIL` + `CMS_SANDBOX_LOGIN_PASSWORD` **and** an exact match. Mirrors the `PAYMENTS_LIVE_MODE` guard in `apps/api/src/common/config/env.schema.ts` — an explicit flag AND `NODE_ENV`, both required, defaulting to off. 8 regression tests in `src/app/api/auth/login/route.test.ts`, including that the sandbox path is refused under `NODE_ENV=production` and that a real backend credential still wins |
| **`unwrapResponseData` was dead code with 18 tests protecting it** | Zero importers once `src/services/` went. Precisely the failure `TESTING.md` §2 warns about; `apps/cms/CLAUDE.md` also called it "the one choke point every response passes through", untrue since the service layer was removed | **`src/lib/api-helper.ts` and `api-helper.test.ts` deleted.** Nothing needed replacing: the envelope's `success` flag is read by `assertEnvelopeOk` and the list key by each module's own `pickArray`. The `src/test/msw.ts` comment and the `CLAUDE.md` claim were corrected |
| `vitest.config.ts` coverage `include` listed `src/services/**`, a directory deleted on this branch | A glob matching nothing contributes nothing to the ratio, so the coverage number measured less than it appeared to | The list now names the real data layer plus the two server-side guards (`/api/crud`, `middleware.ts`); thresholds re-measured and re-set to (actual − 2%) |
| `apps/cms/CLAUDE.md` described `src/services/`, `src/lib/api.ts` as the only client, "zero tests", and "there is no `middleware.ts`" | All four false on this branch | Rewritten. Two new reference docs added under `docs/frontend/cms/` and indexed from `docs/README.md` |

### Corrections to entries earlier in this document

| Entry above | Correction |
|---|---|
| CMS → "No server-side auth guard … no `middleware.ts` anywhere in `apps/cms`" | **Stale.** `apps/cms/src/middleware.ts` exists on this branch (104 lines) and gates every page and every `/api/*` route. The gap moved rather than closed — see the signature row below |
| Security → "CMS proxy sets `Access-Control-Allow-Origin: *`" / "CMS proxy hardcodes `TARGET_HOST`" | **Path no longer exists.** There is no `apps/cms/src/app/api/backend/[...path]/route.ts` on this branch; the catch-all is now `src/app/api/loom/[...path]/route.ts`, which exports **only** `GET` and forwards only allowlisted path prefixes. The root `CLAUDE.md` strangler-boundary invariant still names the old path. Whether the wildcard-CORS and hardcoded-host problems survived the move is **unverified** — re-read the new route |
| CMS → "13 of 24 service files have no try/catch" (in `apps/cms/CLAUDE.md`) | Obsolete: those files are gone. The replacement layer's problem is different — see "two error conventions" below |

### Still open — CMS auth

| Item | Evidence | Impact | Status |
|---|---|---|---|
| The middleware never verifies a JWT signature | Was: `tokenValid()` decoded the payload and checked `exp` only | **Closed 2026-09-03.** The CMS cannot verify the Loom JWT itself (no key), so `/api/auth/login` now mints a `weave_session` cookie HMAC-binding the exact issued token under `CMS_SESSION_SECRET` (`apps/cms/src/lib/session-hmac.ts`), and `middleware.ts` admits a JWT session only when the pair verifies; unset secret fails closed. NOTE: `CMS_SESSION_SECRET` must be set in every deployment (Vercel + VPS) or login returns 500 | Closed |
| **The CMS has no authentication of its own.** Loom is the sole credential authority; nothing in this repo stores or checks a password | `src/app/api/auth/login/route.ts` — the only credential check is `POST /authenticate/email` against Loom | If Loom is unreachable, nobody can sign in except through the explicitly-configured non-production sandbox credential. That is the correct failure mode, but it is a dependency, not authentication the CMS owns | Open and **deliberate — no credential store was invented.** Revisit at the auth cutover (`docs/features/0001-identity-dual-accept-auth.md`) |
| `SANDBOX_ADMIN_TOKEN` is both the service credential and an accepted *session* token value | `sandbox-token.ts` / `loom-service-token.ts` vs `middleware.ts` `tokenValid()` | One secret carries two unrelated trust roles; leaking it as a service credential also grants a UI session. Now reachable only via the gated sandbox login, but the coupling remains | Open, structural |
| `weave_user` identity is session-scoped, not attested | The cookie is written from the email typed at the login form; the Loom JWT carries only an opaque `sub` | `getIdentity()` — and therefore workflow-comment attribution and QC sign-off stamps — is who the *session* says it is, not a cryptographically attested identity | Open, documented in `feedback-identity.ts` and `signoff-identity.ts` |
| Whether `CMS_ACCESS_USER` / `CMS_ACCESS_PASS` (the outer basic-auth gate) are set on the live Vercel deployment | Not readable from this repo | Defence in depth for the unsigned-JWT row above | **Unverified — someone with deployment access must check** |

### Still open — CMS data layer

| Item | Evidence | Impact | Status |
|---|---|---|---|
| The `*-api.ts` layer uses two incompatible error conventions | Six modules throw `BackendFetchError`; `whatsapp-api.ts` returns `Result<T>`; `custom-products-api.ts` does **both** (list returns `Result`, detail throws) | A caller has to know which convention it is holding. Ignoring an `ok:false` renders "no customers found" on a 500 — the exact failure `Result` was introduced to prevent | Open. Both conventions are now pinned by test so a change is visible |
| `getWorkflowFeedbackList` swallows every failure, not just the documented one | `artisanflow-api.ts` — a bare `catch {}`; the comment above it justifies only the expected-forever 401 from the un-synced element-feedback route | A 500 or an envelope rejection on that route silently reads as "no pending feedback" on the order board | Open, **pinned not fixed** (`artisanflow-api.test.ts`): narrowing it changes what the board shows during a real outage, a product decision |
| `pickArray` picks the first array on the envelope when the named key is absent | `artisanflow-api.ts` | The same order-dependent ambiguity the deleted `unwrapResponseData` carried, one layer up | Open, deliberate best-effort |
| `src/lib/api.ts` (1,012 lines) still serves the older `'use client'` pages | 20 importers | Two data stacks run side by side; neither has replaced the other | Open — the migration is half-done, not finished |

### Still open — CMS write paths

| Item | Evidence | Impact | Status |
|---|---|---|---|
| Write logic is inlined into 48 client components | `grep -rl /api/crud src/app src/components \| grep -v src/app/api/` → 48 files | There is no reviewable write layer. `/api/crud` is the only file where a write can be inspected in one place, which is why it carries all the guards and 26 tests | Open, a structural consequence of deleting `src/services/` |
| The dev-tooling write routes are untested | `POST /api/keywords`, `/api/story-mapping/override`, `/api/sync/run`, `/api/journey-tests/run`, `/api/pr-review/{enqueue,merge}`, `/api/feedback` + `/api/feedback/[id]` | Unprotected by tests, though `NEXT_PUBLIC_HIDE_DEV_TOOLS` hides most from the public deployment | Open — deliberately deprioritised below the entity write paths |
| `/api/product/check-unique` sends no `Origin` header | Unlike every sibling bridge, which sends `Origin: localhost` | Harmless against the local wrapper; would fail against any backend applying `@NVerseDomainValidated` | Open, low severity, **unverified against a real Loom host** |
| The 60 lost service tests are not fully replaced | They covered inventory, loyalty, report, review, settings, user, logistic and product domains whose replacements are now inline in client components | Those domains have no unit-testable seam, so the new suite covers the layer that exists rather than the one that was lost | Open. Extracting a hook or a plain function per write form is the remedy, per `TESTING.md` §5 |

## apps/api service-layer audit — 2026-09-02, `fix/flax-audit-remediation`

A deliberate sweep of the service/repository layer against the Java original at
`/Users/saqlainrashid/Downloads/Anuprerna/loom/`, prioritised money → data integrity → tenant
scoping. Everything here was found by reading the port beside its source, not by chasing coverage.

### Fixed in this pass

| # | What was wrong | Evidence | Impact | Fix |
|---|---|---|---|---|
| 1 | **Cart reads could return another customer's cart.** `CartRepository.findByTenantId` routed the tenant id through `ensureTenantExists`, whose last fallback is `SELECT id FROM loom_tenant LIMIT 1`. On any miss the read returned **that** tenant's cart items | `cart.repository.ts` before this pass; Loom's `findCartItemByTenant` is a plain derived finder with no such behaviour | Cross-tenant data disclosure on a gated customer route. `CODE_CU` proves the caller is *a* customer, never the owner — the guard cannot catch this | `findByTenantId` is now a plain scoped read; an unusable tenant id returns `[]`. The arbitrary-tenant fallback was also deleted from `ensureTenantExists`, which the insert path still uses. `cart.repository.spec.ts` |
| 2 | **A GET created user accounts.** The same `ensureTenantExists` call INSERTed a guest `loom_tenant` row (with a shared hardcoded `$2b$10$defaultDummyHashedPasswordForGuestCart…` password) plus a `ROLE_CUSTOMER` grant, as a side effect of reading a cart | as above | Unbounded account creation from unauthenticated-ish reads; junk rows in `loom_tenant` | Removed from the read path. The insert path still calls it — see "Open" below |
| 3 | **Cancelling an order left every item uncancelled.** `cancelOrder` stamped only `cancelled_at` + `cancellation_reason` | `OrderDAOController.updateOrderStatusToCancelled` also runs `orderItems.forEach(oi -> { oi.setOrderStatus(CANCELLED); oi.setUpdatedAt(now); })` | The customer-visible status in `findOrderPreviewsByTenant` is derived from `oi.order_status`, so a cancelled order still read `PROCESSING`/`DISPATCHED` to its owner | `OrderRepository.cancelOrder(id, reason)` now does both writes under one timestamp, and skips the item cascade entirely when the header write matched nothing. `order.repository.spec.ts` |
| 4 | **Orders and custom orders were hard-deleted.** `db.delete(schema.orders)` | Both tables carry `deleted boolean NOT NULL DEFAULT false`; every Loom finder is `...AndDeletedFalse`. A hard DELETE also violates `stripe_transaction.fk_loom_order_id` | Irrecoverable loss of order history; FK violation on any order with a Stripe transaction | Both are now `set({ deleted: true })`, and `findById` / `findCustomOrderById` / both list reads filter `deleted = false` |
| 5 | **`cancelCustomOrder(id, tenantId)` ignored `tenantId`.** The parameter was accepted and dropped | `cancelCustomOrder` before this pass; Loom reaches the entity through `findByIdAndTenantAndDeletedFalse` | Any authenticated tenant could cancel any other tenant's custom order by id | The tenant is now in the `WHERE`; a miss returns `false` and writes nothing, including no item cascade |
| 6 | **A zero-value custom order was silently billed 1500.** `if (subTotal === 0) subTotal = 1500`, plus `String(item.price \|\| 1500)` and `String(item.quantity \|\| 10)` per item | `CustomOrderDAOController.addOrder` invents no price anywhere | Fabricated money on a live write path | Removed. The payload's totals are trusted; `Number(x) \|\| 0` keeps a genuine zero at zero |
| 7 | **Every custom order's `adjusted_total` was 0.** The port never set it; the column defaults to `'0'` | Loom `addOrder`: `if (adjustedTotal == null \|\| adjustedTotal == 0) adjustedTotal = total`. Every later adjustment is `adjustedTotal + delta` | The order is permanently understated by its own total for every downstream adjustment | `createCustomOrder` now writes `adjustedTotal = subTotal` |
| 8 | **`upsertExchangeRate` invented exchange rates.** With no prior snapshot it wrote GBP 106.80 / EUR 91.20 / USD 83.50 | `forex.repository.ts` before this pass | Three fabricated rates persisted into the table from which every foreign-currency price is derived | It now throws rather than seeding, and rejects an unsupported currency code or a non-positive/non-finite rate |
| 9 | **Forex `record_date` was a full millisecond timestamp.** | Loom looks up `findFirstByRecordDate(getDateInMillisecondsWithoutTime(now))` | Rows written by the port can never be found by Loom's own reader; "latest rate" was also non-deterministic among same-day rows | `record_date` is stamped at UTC midnight and "latest" orders by `recordDate DESC, createdAt DESC` |
| 10 | **A `version` of 0 was reported as `null`.** `r.version ? Number(r.version) : null` throughout `forex.repository.ts`; same shape for a zero rate | falsy-zero, the same class of bug as the six frontend ones fixed on 2026-08-12 | `version` is the optimistic-locking column; reporting it as `null` breaks the compare | Explicit `null`/`undefined` checks |
| 11 | **`forex.repository.ts` carried `@ts-nocheck` over a real type error.** `createdAt: BigInt(now)` written into a `bigint({ mode: "number" })` column | surfaced the moment the pragma was removed | A wrong value in a `NOT NULL` column | Pragma removed, value corrected. The file now typechecks |
| 12 | **`DiscountService.getAll` fabricated a coupon.** An empty or unreadable `discount` table returned `WELCOME15`, 15% off, minimum order 1000 | `discount.service.ts` before this pass | An invented discount served from a live gated route as though it were configuration | Removed. An empty catalogue returns `[]` |
| 13 | **`findByCustomerIdPaginated` and `findCustomOrdersByTenant` fell back to tenant 1.** `Number(customerId) \|\| 1` | `order.repository.ts` before this pass | A malformed tenant id served tenant 1's orders | An unusable id now returns `[]` and issues no query |
| 14 | **A spec asserted a falsehood about production.** `commerce/order/order.service.spec.ts` opened "This is the ONLY OrderService actually wired into the running app" | `order.module.ts` registers `./service/order.service.js` and lists only the four controllers under `controller/`; the top-level pair is imported by nothing but its own specs | Exactly the failure this repo's cardinal rule exists to prevent — a confident doc-comment describing code that does not run | Header corrected in place; the characterization tests are kept, relabelled as dead-code characterization |

### Open — found this pass, deliberately not fixed

| # | What | Evidence | Impact | Why not fixed / redo when |
|---|---|---|---|---|
| A | **`commerce/domain/` is 294 routes (a third of the API) with no service layer.** All 28 controllers inject `DATABASE_CONNECTION` and query Drizzle inline — no repository, validator, sanitizer, mapper or tenant scoping | `grep -l DATABASE_CONNECTION commerce/domain/*.controller.ts` → 28 of 28 | None of the repository-level tenant-scoping or soft-delete work in this pass protects any of it, and it cannot be unit-tested below the controller | Controllers were out of scope (another agent owns them). This is the single largest structural gap in `apps/api` |
| B | **Five live gated endpoints return `SELECT * FROM product LIMIT 50` and ignore their path parameter.** `GET /get/impact/order/:orderId`, `POST /trigger/impact/order/:orderId`, `GET /get/impact/order/aggregation`, `GET /get/order/:orderId/workflow-list`, `GET /get/order/:orderId/workflow/:orderItemId` | `commerce/domain/order-migrated.controller.ts`; ten controllers in that directory contain at least one handler of this shape | Placeholder scaffolding shipped as real endpoints — they return products in answer to order and workflow queries | Controller scope. Fix by deleting the handlers or routing them at the real `OrderService`/`ImpactService` |
| C | **`OrderService.createOrder` adopts an arbitrary tenant.** With no `tenantId` in the body and no authenticated tenant it runs `SELECT id FROM loom_tenant LIMIT 1`, and falls back to tenant `1` if even that fails | `service/order.service.ts`; Loom's `addOrder(LoomTenant tenant, …)` takes the tenant and has no fallback | An order attached to a stranger's account | The controller supplying the tenant is out of scope. Pinned by a test in `service/order.service.spec.ts` so the behaviour is visible. Redo when the create route is made to require an authenticated tenant |
| D | **No forex snapshot is written onto an order.** Loom's `addOrder` ends with a switch on `order.getCurrency()` writing `rate.getUsd()/getEur()/getGbp()`, defaulting to `1.0` | `service/order.service.ts` writes no `exchangeRate`; the column is nullable so nothing complains | `orders.exchange_rate` is NULL for every order the port creates, so a foreign-currency order cannot be converted back to INR downstream | Not fixed deliberately: inventing `1.0` for a USD order is worse than a NULL. Needs the forex port wired into `OrderModule`. Pinned by a test that fails when the snapshot lands |
| E | **`updateOrderStatusToProcessing` is not ported.** Any non-`CANCELLED` status writes only an audit note and moves no item or payment status | `OrderDAOController.updateOrderStatusToProcessing` moves eligible items to `PROCESSING` and `paymentStatus` to `PAID` (in-stock / made-to-order) or `PREPAID` (pre-order) | Payment success cannot advance an order | Out of this pass's budget. Pinned by a test |
| F | **Cancellation reasons are hardcoded.** The port writes "Cancelled by user"/"Cancelled by admin" and never rejects | Loom returns `false` when `cancellationReason` is null or empty, and stores the caller's reason | The real reason is lost; an empty-reason cancel that Loom refuses succeeds here | Needs a DTO change on the controller. Low impact relative to A–E |
| G | **`findExchangeRateByCode` answers an unknown currency with the whole snapshot.** `ForexHelperService` throws `IllegalArgumentException` | `forex.repository.ts` | A caller asking for JPY gets a 200 and three irrelevant rates | The current shape is what the `/forex` read route serves. Pinned by a test rather than changed |
| H | **`ensureTenantExists` still creates guest tenants on the cart insert path**, with a shared hardcoded password hash (`$2b$10$defaultDummyHashedPasswordForGuestCart1234567890` — not a valid 60-char bcrypt hash, so it cannot authenticate, but it is committed and identical for every guest) | `cart.repository.ts` | Junk `loom_tenant` rows; a committed dummy credential | Guest-cart support is a product decision, not a bug to silently delete. Redo when guest carts are designed properly |
| I | **`commerce/loyaltyprogram` is unaudited.** A 17-line `@ts-nocheck` pass-through service, one repository, no service or repository spec, and money columns throughout (`min_order_value`, `min_order_value_inr`, `exchange_rate numeric(8,4)`, `discount_percentage`, all `NOT NULL`) | `loyaltyprogram.service.ts`, `schema.loyaltyProgramConfig` | Same bug class as the forex findings above, unexamined | Ran out of budget. **Highest-priority remaining money module** |
| J | **PARTIALLY RESOLVED — `forex`, `inventory` and `order` dead top-level pairs have since been deleted**, and the five orphaned specs left pointing at them (`forex/forex.controller.gates.spec.ts`, `inventory/inventory.controller.gates.spec.ts`, `order/order.controller.gates.spec.ts`, `order/order.controller.spec.ts`, `order/order.service.spec.ts`) were removed with them — each gated `create`/`getAll` handlers that no longer exist, and the co-located specs under `controller/`/`service/` cover the real handler sets. Still dead: **`commerce/<m>/<m>.service.ts` for** (`impact`, `material`, `navigation`) — the module registers `<m>/service/<m>.service.ts` instead. `misc` and `transmission` register the top-level file | each module's `*.module.ts` import line | Two services per domain, one unreachable, no marking on either. A reader (or an agent) will edit the wrong one — as the stale spec header in item 14 above shows already happened | Deleting them is a separate, mechanical change |
| K | **310 of 665 `.ts` files under `apps/api/src` carry `@ts-nocheck`** (502 files are non-spec) | `grep -rl '@ts-nocheck' --include='*.ts' src \| wc -l` | The typechecker protects roughly half the tree. Removing the pragma from one file this pass immediately surfaced a real defect (item 11) | A per-file effort. Every `@ts-nocheck` removed should be assumed to reveal at least one bug |
| L | **Service-layer coverage is still thin.** After this pass: 76 services with 9 co-located spec files, 55 repositories with 3, 38 mappers with 8 | `find src -name '*.service.ts' \| wc -l` etc. | Most business logic is unprotected | Deliberate: this pass went depth-first on money and tenant scoping rather than breadth-first on counts |

---

## `commerce/domain/` path-parameter, IDOR and `/track/*` pass

Items A and B above are **partially closed**. What changed, and what is still open.

### Closed this pass

| What | Route(s) | Now |
|---|---|---|
| Ignored path parameter + arbitrary `SELECT * FROM product LIMIT 50` | `GET /get/impact/order/:orderId` | Real order impact summary for the requested id, tenant-scoped, keyed `impact` |
| same | `GET /get/order/:orderId/workflow-list` | Loom's `findWorkflowSummariesByOrderId` ported verbatim, keyed `workflowList` |
| Arbitrary product dump (no path param) | `GET /get/impact/order/aggregation` | Loom's `RETRIEVE_IMPACT_AGGREGATION` ported verbatim, keyed `impactAggregation` |
| same | `GET /get/related-products/id/:csv` | Loom's `findRelatedProducts` native query per id, keyed `relatedProductsList` |
| same | `GET /get/product-preview-list/:category` | Full preview list keyed `productPreviewList` (Loom ignores `{category}` too — reproduced, not invented) |
| same, no Java original | `POST /trigger/impact/order/:orderId`, `GET /get/order/:orderId/workflow/:orderItemId`, `DELETE /delete/finished-product/:productId`, the two `GET /get/master/:masterId/worker/:artisanId/workflow/...` routes | `501 Not Implemented` |
| Ignored `:id`, returned the first 50 rows | the seven `GET /get/table-explorer/data/<entity>/:id` readers in `address`, `category` (×2), `customer`, `product` (×2), `order` controllers | `WHERE id = :id`, one row or `null` |
| **IDOR** | `GET /get/customer/loyalty/info` | Was `SELECT * FROM customer LIMIT 50` to any authenticated customer — 50 other people's rows incl. WhatsApp numbers. Now one row resolved from `@CurrentTenant()` |
| **IDOR** | `GET /get/customer/custom-order/:orderId/fulfill`, `.../fulfillment-list` | Filtered on the path id alone; any customer could enumerate ids for others' shipment codes, tracking URLs, delivery dates. Now joined through `custom_order.tenant_id = @CurrentTenant()` |
| **IDOR** | `GET /get/impact/order/:orderId` (`CODE_SUCU`) | Loom's `superUser ? null : tenant`, decided by the real `GatekeeperService` |
| **Enumerable tracking** | `/track/order/:id`, `/track/awb/:id`, `/track/batch/:id` | Re-gated `CODE_SU` → `CODE_CU` and ownership-scoped (`tracking.service.ts`). `/track/all` stays `CODE_SU` |
| **Write path that lied about writing** | `PUT`/`POST /manage/wishlist/:commaSeparatedSkuList` | Parsed the SKUs, wrote nothing, answered "Wishlist updated successfully." Now `CustomerDomainService.replaceWishlist` performs Loom's whole-list replace of `customer.wishlist` scoped by `@CurrentTenant()`; empty/oversize lists are `400` (Loom's `StringValidator(csv, 0, 9999)`), and a tenant with no `customer` row gets `success: false` (Loom's `ActionCode.NO_ACTION`) instead of a false success |
| **Fabricated tracking records** | `TransmissionService.getAll()` | Returned two hardcoded records (`EMAIL_DISPATCH_TRANSMISSION` / `WHATSAPP_DISPATCH_TRANSMISSION`) whenever the table was empty. Override deleted — an empty table reads as empty |
| **Invented delivery estimate and timeline** | `buildTrackingResponse` behind all four `/track/*` routes | `estimatedDelivery` was synthesized as `createdAt + 7 days` and the timeline fabricated `ORDER_PLACED` (−1d), `IN_TRANSIT` (+1d) and `DELIVERED` (+5d) with matching prose. Now: `estimatedDelivery` is always `null` (no ETA field exists), the timeline carries only the one status the record actually holds at the one timestamp it actually holds, absent fields surface as `null`, `createdAt` no longer falls back to `Date.now()`, and a record with no tracking information returns "No tracking information available" rather than a plausible blank envelope |

### Still open

| # | What | Why not fixed |
|---|---|---|
| M | **`commerce/domain/` still has no service layer for ~280 of its 294 routes.** Three services were extracted (`order-domain`, `product-domain`, `customer-domain`) covering only the routes fixed above; the rest remain inline Drizzle with swallowing catches | Deliberate. Extracting 294 routes is not a one-pass job; this pass went where correctness was actually broken. Item A stands for the remainder |
| N | **Standard-order impact recalculation is not ported.** `POST /trigger/impact/order/:orderId` is `501` | Loom's `calculateOrderImpact` drives `ImpactCalculationService.calculateStandardImpact` per order item against persisted `ImpactAssumptions`. Only the **custom**-order engine is ported (`commerce/impact`). Redo by mirroring `CustomImpactCalculationService` for standard orders |
| O | **`GET /get/order/:orderId/workflow/:orderItemId` has no Java original.** `RequestMapper.GET_ORDER_WORKFLOW_STATUS` is declared but no handler is mapped to it anywhere in loom | Response shape is undeterminable. `501` until someone specifies it |
| P | **`DELETE /delete/finished-product/:productId` has no Java original.** Delete semantics (hard delete / disable / cascade to `product_finished`) unknown | `501`. A destructive endpoint that silently no-ops was worse |
| Q | **`GET /get/master/:masterId/worker/:artisanId/workflow/:workflowId/assigned-element-details` returns two lists in Loom**, not one — `retrieveWorkflowStepElementListByArtisan` + `retrieveWorkflowSubProcessElementListByArtisan` | Neither query is ported. `501` rather than a 200 in the wrong envelope |
| R | **`/track/*` has no guest path.** Tracking by a sequential order id without authentication is enumeration by construction | Fails closed (`CODE_CU`). A guest flow needs an unguessable per-shipment token, which does not exist in the schema. Add the column before adding the route |
| S2 | **`/track/*` has no real ETA or carrier event source.** The fabricated ones are gone, so `estimatedDelivery` is now always `null` and the timeline holds a single status event | Correct but thin. `TransmissionPayload` stores no ETA and no event history; a real one needs either the carrier webhook or `order_item.estimated_delivery_to`. Do NOT re-add a computed estimate |
| U | **`GET /get/product-preview-list/:category` diverges from Loom.** Loom's `findAll()` includes `disabled = true` rows; this reuses `ProductPreviewService.listActive` (`disabled = false`) and caps at 5000 | Deliberate: a disabled product must not appear in a public preview list. Flagged rather than silently matched |
| V | **`GET /get/loyalty-program/config` and `PATCH /update/loyalty-program/config` have no Java counterpart at those paths.** Loom exposes `POST /enable/loyalty-program` (CODE_SU) and reads by customer; the customer-info route is `/get/customer/loyalty/info`, not `/get/customer/loyalty-info` | The handler semantics were ported (`enableLoyaltyProgram`: id → update, else onboard; reads are per-customer), but the *paths* were left as-is to avoid colliding with the concurrent route pass. Rename to the Loom paths in that pass |
| W | **Loyalty adjustment/renewal/expiry emails are not sent.** Loom's `updateExistingProgram` fires onboard / renewal / adjustment / expiry notifications through `BloomsightEmailAdapterService`, and the renewal and expiry bodies carry `LoyaltyProgramCustomerMetrics` figures | Not ported. `getLoyaltyProgramCustomerMetricsList` is not available in this repo, and sending a money-bearing email with fabricated metrics is worse than sending none. The config writes themselves are complete and audited |
| X | **`/download/report/:type` writes CSV, not PDF, and pdfkit was removed.** Loom's `ReportController` sets `text/csv` and a `.csv` filename; `FabricStockReport`/`FinishedStockReport` write rows through a `PrintWriter` | The previous TS code was a PDF generator over hardcoded placeholder stock rows. Both generators now run the real `product_zoho_relation` queries. Fields are written unquoted exactly as Java's `printf` does, so a product name containing a comma splits the row in both implementations — fix on both sides together if it matters |

---

## FLAX-TEST merge pass — 2026-09-03

`fix/flax-audit-remediation` (this branch, pushed to origin standalone) merged `origin/FLAX-TEST` locally to pick up its one net-new feature (the CMS/storefront feedback widget) without inheriting the defects `FLAX-TEST-PR10-AUDIT.md` catalogued against PR #10. FLAX-TEST itself was left untouched — nothing here was pushed back to it.

### Closed as part of the merge

| What | Where | Now |
|---|---|---|
| **Hardcoded login bypass** | `apps/storefront/src/app/api/auth/login/route.ts` | FLAX-TEST's version accepted a fixed email/password pair (`anantkr10000@gmail.com` / `Anant@1234`), stored plaintext passwords in a module-level map, and hardcoded two fallback API URLs including `127.0.0.1:3000`. None of it survived the merge — the pre-merge (audited) version, which does nothing but relay to Loom and never stores a credential, was kept in full |
| **Fabricated checkout-order fallback** | `apps/storefront/src/app/api/checkout/order/route.ts` | On any backend decline, non-2xx, or network failure, silently answered `200 {success:true}` with an invented `orderId` (`Date.now()`), a random order number, and a hardcoded `amount: 8128` when the caller sent none. Now a decline is `400`, a non-2xx from Loom relays Loom's real status, and an unreachable backend is `502` — never a fabricated order |
| **Fabricated "payment verified" fallback** | `apps/storefront/src/app/api/checkout/payment-callback/route.ts` | Any backend failure or decline was answered `{success:true, message:"Payment verified successfully."}` without the signature ever being checked — the same shape of bug as the API-side C4/C5 findings, just moved into the storefront BFF. Now relays Loom's real status/body, or `502` if unreachable |
| **Fabricated payment-session fallback** | `apps/storefront/src/app/api/checkout/payment-session/route.ts` | A failed session-open silently downgraded `razorpay` to a `'sandbox'` provider the buyer never chose, with a hardcoded `amount: 8128` and a fake `keyId: 'rzp_test_mock'`. Now relays Loom's real status/body, or `502` |
| **Fabricated sandbox-gateway callback** | `apps/storefront/src/app/api/checkout/sandbox-gateway/route.ts` | Same pattern: a failed call to Loom's own sandbox-gateway endpoint fell back to a client-invented `providerPaymentId`/`signature` pair. Now relays Loom's real status/body, or `502` |
| **Live Neon Postgres password + S3 keys hardcoded as source fallbacks, committed to the repo** | `apps/storefront/src/lib/neon.ts`, `apps/cms/src/lib/neon.ts`, `apps/cms/src/app/api/feedback/submit/route.ts` | All three `process.env.X \|\| "<secret>"` fallbacks removed. Every credential (`DATABASE_URL`, `NEON_S3_ENDPOINT`, `NEON_S3_ACCESS_KEY_ID`, `NEON_S3_SECRET_ACCESS_KEY`, `NEON_FEEDBACK_BUCKET`) is now required at the call site and throws if unset — misconfiguration fails loudly instead of silently authenticating against production with a key anyone reading the repo could read. **The exposed Neon password and both S3 keys must be rotated in the Neon console; this pass could only remove them from source, not invalidate them** |
| **Merge-artifact duplicate imports** | 6 storefront files (`product/[category]/[slug]/page.tsx`, `AuthShell.tsx`, `UnavailableShell.tsx`, `AdsLandingPage.tsx`, `B2bLandingPage.tsx`, `WholesalerCityPage.tsx`) | Git's 3-way merge landed two `import Link from 'next/link'` lines in each (no textual conflict, so no marker to catch it) — `tsc` caught all six as `TS2300: Duplicate identifier`. Deduplicated |
| **Fabricated `ORDER_PLACED` timeline / synthesized ETA** | `apps/api/src/commerce/transmission/tracking.controller.ts` | Already closed on this branch before the merge (see the pass above); FLAX-TEST's own spec still pinned the old fabricated behavior as a known, unfixed bug. This branch's fix and its tests won the merge cleanly — verified post-merge that no `BUG:`-pinned test regressed it |

### Still open — feedback widget

- **Real bucket name is `feeback`, not `feedback`** — confirmed against the Neon project's own `/neon.ts` config at the repo root, which declares `buckets: { feeback: {...} }`. This is the project's actual (if unfortunate) configuration, not a typo to "fix". `NEON_FEEDBACK_BUCKET` must be set to `feeback` in every environment.
- **`.env.example` documents the five required Neon vars** in `apps/storefront/.env.example`; `apps/cms` has no `.env.example` file to extend (pre-existing gap, not introduced here) — its required vars are the same five plus `AWS_ENDPOINT_URL_S3` is *not* used for the feedback bucket (Netlify reserves the `AWS_` prefix; use the `NEON_S3_*` names in both apps).
- **Not verified end-to-end**: no local Postgres/S3 credentials were available in this environment to actually exercise `saveFeedbackToNeon` / `uploadFeedbackImageToNeon` against a live Neon instance. Typecheck, lint and the existing test suites are green; a manual smoke test of the feedback widget against real Neon credentials is still owed before this ships to production.

## Frontend-invented endpoints — 2026-09-04 404-backfill pass

Three routes the frontends already call. Two shipped; one cannot.

### `GET /get/workflow/{workflowId}/comments` — NOT BUILT, and not stubbable

`apps/cms/src/lib/artisanflow-api.ts` `getWorkflowComments` reads
`workflowCommentList`, and `getWorkflowCommentCounts` calls a second invented
route, `GET /get/workflow-comment-counts?ids=`. Neither exists in Loom; the CMS
designed both.

**There is no table to serve them from.** `src/database/schema/schema.ts`
contains zero occurrences of the string `comment` — no workflow-comment table,
no discussion table, nothing with a compatible shape. The schema is introspected
from the running Postgres (`pnpm db:introspect`), so this is the live database,
not a stale file.

Building the route anyway would mean either creating a table (DDL, out of scope
and not something to do from an endpoint pass) or returning a hardcoded `[]`.
The second is worse than the 404: the CMS's `catch` already degrades a 404 to an
empty list, so a fake empty success and a genuinely empty discussion would be
indistinguishable, and the missing feature would look implemented forever.

To finish: add the table (`workflow_comment`: id, workflow_id FK, text,
author_tenant_id, created_at) via a real migration, re-run `db:introspect`, then
serve both routes off it — `workflowCommentList` and `counts` respectively.
Note `workflowId` is ONE id space across ORDER and CUSTOM_ORDER jobs (the CMS
shares this component between both detail pages), so the table keys on
`workflow.id` and needs no type discriminator.

### `POST /apply/coupon/{code}` — shipped, with one caveat OUTSIDE apps/api

Serves `checkout.repository.ts` `applyCoupon`. It runs the same
`DiscountService` evaluation as `/apply/voucher/discount` — one pricing path,
not two — and returns the real `discount` row's percentage under `payload`.

The caller sends **no body**, so the cart value is unknown and a coupon with a
non-zero `minimum_order_value` is refused with "cart total not supplied" rather
than approved. `cartTotal` is accepted in an optional body for callers that can
supply it. It is deliberately not derived server-side: `cart_item` stores no
price, so a cart subtotal would mean a second pricing path beside
`CheckoutService` (catalogue prices, volume tiers, making charges, units) — the
usual source of divergent money.

**Open defect, in `apps/storefront` (not owned by this pass):**
`checkout.repository.ts` `applyCoupon` computes
`Number(respPayload.discountPercentage) || 10`, and initialises
`discountPercentage = 10`. Because `|| ` treats 0 as absent, a genuine
`FREE_SHIPPING` coupon (percentage 0) is rendered to the buyer as **10% off**
that no backend ever granted — the same fabrication class as the removed
`WELCOME15`. The backend now returns the truthful 0; the storefront must stop
substituting. Fix: `Number.isFinite(n) ? n : 0`, and drop the `= 10` seed.
