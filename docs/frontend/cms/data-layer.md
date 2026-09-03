# apps/cms — the `src/lib/*-api.ts` data layer

Verified against the code on `fix/flax-audit-remediation`, 2026-09-02. Every claim below traces to a
file that was read; anything not confirmed is marked **unverified** rather than asserted.

> **This supersedes the "How data flows" table in `apps/cms/CLAUDE.md` and the CMS paragraph in
> `docs/frontend-conventions.md`, both of which describe `src/services/*.ts` → `src/lib/api.ts`
> (axios) → `unwrapResponseData()`. That layer does not exist on this branch.** `src/services/`
> was deleted and replaced by the modules described here. `src/lib/api.ts` (1,012 lines) still
> exists and still has **20 importers** among the older `'use client'` pages, so the two stacks run
> side by side and neither has replaced the other yet. `src/lib/api-helper.ts`
> (`unwrapResponseData`) was **deleted on 2026-09-02** — it had zero importers once `src/services/`
> went, and 18 tests on it made dead code read as covered. The envelope is now read by
> `assertEnvelopeOk` (the `success` flag) plus each module's own `pickArray` (the list key).

## 1. What the layer is

Eight server-side modules, one per domain, each a thin function-per-endpoint client over a single
shared GET helper. They are imported from **Server Components and route handlers**, never from the
browser: the token they attach is a server-only secret.

| Module | Owns | Backend endpoints it calls | Failure convention |
|---|---|---|---|
| `artisanflow-api.ts` (2,087 ln) | The whole `/artisanflow/*` corner — custom orders, workflow templates, workflow instances, artisan assignment, QC feedback, the order board, and the delay/schedule arithmetic | `/get/super-user/custom-order-list`, `/get/super-user/custom-order/{id}` (+ `/fulfillment-list`, `/ready-list`), `/get/workflow-template-list`, `/get/workflow-template/{id}`, `/get/workflow-list/{status}`, `/get/custom-workflow-list/{status}`, `/get/workflow/{id}`, `/get/custom-workflow/{id}`, `/get/workflow/{id}/comments`, `/get/workflow-comment-counts`, `/get/element/feedback`, `/get/element-feedback/queue`, `/get/artisans`, `/get/impact/order/{id}`, `/get/table-explorer/data/workflow` | Throws for systemic failures **and** envelope rejections; returns `[]` / `null` for a 200 with no matching row. One documented exception, §4. |
| `admin-api.ts` (449 ln) | Customers, carts, settings, reviews, cron logs, AI-embedding stats, table-explorer table list, WhatsApp consent rows | `/get/customers`, `/get/customers/whatsapp-status`, `/get/tenant/cart-item/list`, `/get/settings-list`, `/get/super-user/review…`, `/get/cron-logs`, `/get/ai-embedding-stats`, `/get/table-explorer/tables`, `/get/loyalty-program/customers/metrics…` | Throws |
| `content-api.ts` (353 ln) | Blogs, stories, FAQs and their taxonomies | `/get/blog-content-list`, `/get/blog-content/{id}`, `/get/blog-content-category-list`, `/get/blog-content-types`, `/get/story-content-list`, `/get/story-content/{id}`, `/get/story-content-category-list`, `/get/faqs`, `/get/faq/{id}` | Throws |
| `artisans-api.ts` (246 ln) | Artisan list, one artisan, a master artisan's workers, skills, artisan catalogue; normalises the tenant-nested shape onto the row | `/get/artisans?includeInactive=true`, `/get/artisan/{id}`, `/get/artisan/{id}/workers`, `/get/skills`, `/get/catalog-list` | Throws |
| `whatsapp-api.ts` (175 ln) | Sent-message history, per-customer consent | `/get/table-explorer/data/whatsapp-notification-history`, `/get/customers/whatsapp-status` | **`Result<T>`** — never throws |
| `custom-products-api.ts` (143 ln) | The made-to-spec catalogue entity (NOT the custom *order*) | `/get/custom-product`, `/get/custom-product/{id}` | **Mixed**: the list returns `Result<T>`, the detail throws |
| `profiles-api.ts` (96 ln) | The seven product-profile taxonomies | `/get/badge-profile-list`, `/get/fabric-profile-list`, `/get/finish-profile-list`, `/get/size-profile-list`, `/get/custom-size-profile-list`, `/get/made-to-order-profile-list`, `/get/volume-discount-profile-list` | Throws |
| `catalog-api.ts` (65 ln) | The catalogue taxonomies | `/get/category-list`, `/get/sub-category-list`, `/get/segment-list`, `/get/sku-group-list`, `/get/special-status-list`, `/get/color-list`, `/get/material-list`, `/get/pattern-list`, `/get/tag-list` | Throws |

Two error conventions in one layer is a real inconsistency, not a design: a caller has to know which
one it is holding. Recorded in `KNOWN-GAPS.md`.

### The single GET

Every module routes through `loomGetJson(clientLabel, path, token)` in
`src/lib/backend-fetch-error.ts`, aliased locally as `afGet` / `waGet` / `loomGet` etc. It:

1. resolves the base URL — `process.env.BACKEND_URL` server-side, `NEXT_PUBLIC_BACKEND_URL` in the
   browser, `http://localhost:8090` if neither is set;
2. sends `Content-Type`, `Accept`, and **`Origin: localhost`** (the backend's
   `@NVerseDomainValidated` check requires a present, allowlisted `Origin`), plus
   `Authorization: Bearer <token>` when a token is passed;
3. classifies every failure into a `BackendFetchError`, `console.error`s it, and throws;
4. passes the parsed payload through `assertEnvelopeOk` and then `rewriteBloomscorpUrlsDeep`.

Each module used to carry a byte-identical copy of this wrapper and every copy stopped at `res.ok`,
which is how the `{success:false}` envelope slipped past all eight at once.

## 2. `BackendFetchError.kind` — the five classifications

`kind` is what a page is meant to branch on. All five carry a plain-English, cause-specific
`message` naming the HTTP status and the calling module (`[artisanflow-api] …`), written to be read
straight off the rendered page.

| `kind` | Raised when | What it means | What the UI should say |
|---|---|---|---|
| `network` | `fetch()` rejected before any response — connection refused, DNS, timeout | The backend is not reachable at all | "Is the backend running, and is `BACKEND_URL` / `NEXT_PUBLIC_BACKEND_URL` right?" |
| `auth` | HTTP 401 or 403 | The token the CMS sent was rejected | "`SANDBOX_ADMIN_TOKEN` in the CMS `.env.local` does not match the backend's" |
| `isolated` | HTTP 503 or 501, or a body matching `not_implemented` / `sandbox…isolat` | The backend is running older code than this route needs | "Pull latest and rebuild the backend" |
| `server` | Any other non-2xx | An unexpected backend error | The status plus the first 200 bytes of the body |
| `rejected` | **HTTP 200** with `{ success: false, message }` in the envelope | A *business* refusal. The backend was reached and answered — this is **not** a config or connectivity fault | The backend's own `message` |

`rejected` is the one that matters most and the newest. The Loom envelope signals refusal at HTTP
200, so a caller checking only `res.ok` reads a refusal as an ordinary payload with no list key on
it — and renders an **empty table**. A refusal must never be indistinguishable from "no rows".

**What is deliberately NOT an error:** a 200 whose envelope simply carries no matching record. That
never reaches this module; callers see it as an ordinary `undefined` field
(`j.order ?? null`) and return `null` / `[]`. "Refused" and "does not exist" stay distinct.

`rethrowIfSystemic(e)` re-throws **any** `BackendFetchError`, `rejected` included — despite the
name. Callers use it in a `catch` so a systemic failure surfaces while other exceptions fall through
to their fallback.

## 3. The `load-or-banner` page pattern

`src/lib/load-or-banner.tsx` is how a server page surfaces a backend failure. **22 pages use it**
(measured: `grep -rl loadOrBanner src/app` → 22 files, from `/artisans` through `/table-explorer`).

```tsx
export default async function Page() {
  return loadOrBanner(
    () => getCategoryList(getSandboxToken()),
    (rows) => <CategoriesClient rows={rows} />,
  );
}
```

- A `BackendFetchError` from `load` renders `<WeaveShell><ErrorBanner message={e.message} /></WeaveShell>` —
  an amber `role="alert"` strip reading "Failed to load: …".
- **Any other exception propagates** to Next's error boundary. Catching those would recreate the
  silent-failure class this helper exists to remove.
- Only `load` is guarded. An exception thrown inside `render` is not caught.

A page that does its own `try/catch` and falls back to an empty array is the anti-pattern; that is
what these 22 pages were converted away from.

**Pages NOT on this pattern:** every `'use client'` page that fetches in a `useEffect` (the
majority of the app's 96 routes) still owns its own error state, and the ~19 routes listed in
`KNOWN-GAPS.md` still render fabricated or placeholder data instead of calling a backend at all.
The pattern covers the server-rendered list pages, not the app.

## 4. Per-module failure behaviour worth knowing

- **`getWorkflowFeedbackList` (artisanflow) swallows everything.** Its route proxies to live Loom
  and permanently 401s under the sandbox token until the element-feedback sync lands, so the
  failure is expected-forever and swallowed on purpose. The `catch {}` is wider than the comment
  above it claims: it also swallows 500s and envelope rejections. Pinned by test, recorded in
  `KNOWN-GAPS.md`. Its sibling `getWorkflowFeedbackQueue` does *not* swallow.
- **`getWorkflowList` reads two endpoints and merges them.** Standard order workflows
  (`/get/workflow-list/{status}`) and custom-order workflows (`/get/custom-workflow-list/{status}`)
  are separate endpoints; the production board needs both. Dedupe keys on **`workflowType:id`**, not
  `id` — the two id sequences are independent, and an id-only key silently drops the custom-order
  job on every collision (standard is spread first, so it is always the custom one that vanishes).
- **`pickArray` falls back to the first array on the envelope** when the named list key is absent.
  Best-effort by design (the backend has renamed list keys before), and order-dependent in the same
  way `unwrapResponseData` is.
- **`whatsapp-api` and the `custom-products` list return `Result<T>`.** A caller that ignores
  `ok:false` renders "no customers found" on a 500. Nothing enforces the branch.

## 5. Tests

`src/lib/*.test.ts` co-located, MSW at `src/test/`, `onUnhandledRequest: "error"`. All eight
modules now have a suite; `artisanflow-api.test.ts` (55 tests) covers the classification matrix, the
two-endpoint merge, the money arithmetic (`computeCustomOrderMoney`, `fulfilledQty`, `readyQty`) and
the delay/schedule arithmetic (`nodeDelay`, `workflowDelaySummary`, `workflowSchedule`).
Fixtures must use the real envelope shape via `envelope()` / `errorEnvelope()` from `src/test/msw`.
