# apps/cms — the auth/session model and the write paths

Verified against the code on `fix/flax-audit-remediation`, 2026-09-02, by reading every file named
below. This document exists because the last two things written about CMS auth were both wrong in
opposite directions, and the root `CLAUDE.md` names that failure explicitly ("a CMS auth middleware
that never existed"). So: what follows was checked, and what could not be checked says so.

---

## 1. The session model

### 1.1 There IS a `middleware.ts` now — and it is not the one that was once documented

`apps/cms/src/middleware.ts` exists on this branch (`find apps/cms -name middleware.ts` → one hit,
104 lines). It is a real Next.js middleware with a `config.matcher` covering everything except
`_next/static`, `_next/image`, `favicon.ico`, `icon`, `robots.txt`, `sitemap.xml` and static asset
extensions.

> **Two documents currently say the opposite and are stale, not wrong-in-spirit:**
> `apps/cms/CLAUDE.md` rule 5 ("There is no `middleware.ts` and no server-side guard") and
> `docs/KNOWN-GAPS.md` → CMS → "No server-side auth guard". Both describe the pre-branch state.
> The gap they were pointing at has moved, not closed — see §1.4.

### 1.2 What a session is

| Cookie | Set by | Contents | Flags |
|---|---|---|---|
| `weave_token` (name overridable via `AUTH_COOKIE_NAME`) | `POST /api/auth/login` | A Loom JWT, **or** the raw `SANDBOX_ADMIN_TOKEN` when the fail-closed sandbox credential below is configured and matched | `httpOnly`, `sameSite: lax`, `path: /`, `maxAge` 8h |
| `weave_user` | `POST /api/auth/login` | base64 of `{email, name}`, the name derived from the email local-part | `httpOnly` since 2026-08-16, same lifetime |

There is no server-side session store. The JWT itself carries no email or name — only an opaque
`sub` — which is why the second cookie exists.

`src/lib/feedback-identity.ts` → `getIdentity()` is the single server-side identity resolver:
presence of `weave_token` means authenticated; `weave_user` supplies `email` / `name`; `isOwner` is
true for the two addresses in `OWNER_EMAILS` (`amit@`, `support@anuprerna.com`).

### 1.3 What the gate actually enforces

`middleware()` runs two gates, in this order:

1. **Outer basic-auth gate** (`basicAuthGate`) — active only when both `CMS_ACCESS_USER` and
   `CMS_ACCESS_PASS` are set (the public Vercel deployment; unset on the VPS, where it is a no-op).
   It challenges **everything**, including `/login`, before the session gate runs.
2. **Session gate** — `/login` and `/api/auth/login` are public. For everything else
   `tokenValid(token)` must pass:
   - the token equals `SANDBOX_ADMIN_TOKEN` → valid, or
   - it splits into exactly three dot-separated parts, its middle part base64url-decodes to JSON,
     and `exp` (if numeric) is in the future.

   Failing that: `/api/*` gets **401 JSON**; every other path gets a **307 to
   `/login?next=<encoded path>`**. The 401-not-redirect split matters — a redirect would be followed
   by `fetch()` and parsed as HTML, so the caller would report a JSON parse error instead of "not
   signed in".
3. A third rule rides along: when `NEXT_PUBLIC_HIDE_DEV_TOOLS=1` (set only on Vercel),
   `/rebuild-map`, `/journey-tests` and `/code-review` redirect to `/dashboard` so their
   VPS-local-filesystem server code never executes.

All of the above is pinned by `src/middleware.test.ts` (18 tests).

### 1.4 Where it is missing — stated plainly

- **The JWT signature is never verified.** `tokenValid` decodes the payload and checks `exp`; the
  signature segment is ignored. Any forged three-part token with a future `exp` is a valid session.
  The file says so itself and calls it "the v1 bar". The backend remains the cryptographic
  authority for anything it gates — but many CMS screens read via a **server-side service token**,
  not the caller's, so for those the middleware IS the only check. (The middleware's own comment
  puts that number at 69 screens; that figure is carried from the code and **unverified** here.)
- **There is no CMS-owned credential store, and the CMS does not have real authentication of its
  own.** `/api/auth/login` asks the Loom backend to verify the email and password
  (`POST /authenticate/email`) and mints a session only if Loom returns a JWT. Loom is the sole
  authority; nothing in this repo stores or checks a password.
- **The sandbox fallback is fail-closed, and was not always.** Until 2026-09-02 `token` was
  initialised from `SANDBOX_ADMIN_TOKEN` *before* the auth call and nothing cleared it on refusal,
  so any email + any password minted a session — an authentication bypass. It now requires **all
  four** of: `CMS_SANDBOX_LOGIN=true`, `NODE_ENV !== "production"`, a configured
  `CMS_SANDBOX_LOGIN_EMAIL` + `CMS_SANDBOX_LOGIN_PASSWORD`, and an exact match against them
  (email case-insensitive, password not). Any one missing and the login is refused. This mirrors the
  `PAYMENTS_LIVE_MODE` guard in `apps/api/src/common/config/env.schema.ts`: an explicit flag AND
  `NODE_ENV`, both required, defaulting to off. Eight regression tests hold it.
- **Identity is session-scoped, not attested.** `getIdentity()` answers "who the session says it
  is": the `weave_user` cookie is written from the email typed at the login form, not from anything
  the backend asserts (the JWT carries only an opaque `sub`). Callers may rely on it being stable
  and server-controlled for the life of a session; they may not treat it as cryptographic proof of
  identity. `deriveCommentAuthor` and `resolveSignOff` both carry this limitation in their headers.
  Note this is now weaker than the credential check itself, not equal to it.
- **Client-side auth still exists in parallel and is weaker.** `src/lib/auth-service.ts` keeps a JWT
  in `localStorage` (plus five obfuscated chunk keys), and its `hasValidJWT()` returns true for any
  non-empty string — `isTokenExpired()` is correct but has zero callers. That is unchanged from
  `KNOWN-GAPS.md` and is not what gates the server.
- **Unverified:** whether `CMS_ACCESS_USER` / `CMS_ACCESS_PASS` are actually set on the live Vercel
  deployment. That is deployment configuration and cannot be read from this repo. If they are not
  set, §1.4's first two bullets have no compensating control.

### 1.5 The service credential is a different thing

`SANDBOX_ADMIN_TOKEN` is the **service** credential for the CMS→wrapper hop
(`src/lib/sandbox-token.ts` → `getSandboxToken()`, and `src/lib/loom-service-token.ts` →
`getServiceToken()`). It is server-only (no `NEXT_PUBLIC_` prefix) and is attached to the gated
native endpoints. It is *also* accepted as a user session token by `tokenValid`, which is what
collapses the two roles into one secret.

---

## 2. The write paths

Reads go through `src/lib/*-api.ts` (see [`data-layer.md`](./data-layer.md)); **writes do not go
through that layer at all**. `artisanflow-api.ts` is read-only by design and every `*-api.ts` module
exposes GETs only. Writes take one of four routes.

### 2.1 `POST /api/crud` — the generic write forwarder

`src/app/api/crud/route.ts`, 765 lines, and the single highest-risk unit in the app. **48 client
files post to it** (`grep -rl /api/crud src/app src/components | grep -v src/app/api/` → 48, spanning catalogue,
content, artisans, listings, orders, reviews, settings, inventory, logistics, wholesale and the
whole of ArtisanFlow).

Contract: `POST { path, method?, body? }`. The route attaches the service token and forwards to
`${BACKEND_URL}/${path}`. Every guard below is pinned by `src/app/api/crud/route.test.ts` (26 tests).

1. **Path normalisation.** The query and fragment are cut on the **raw** string, the path is split on
   **raw** `/`, and each segment is decoded individually and re-encoded on the way out. So the string
   the guards inspect and the string that is forwarded are the same URL. An encoded `%3F` or `%2F`
   stays inside its segment instead of restructuring the path; `.`/`..` and null bytes are refused.
2. **Write verbs only.** First segment must be one of `add`, `update`, `delete`, `disable`, `enable`,
   `cancel`, `upload` — lowercase, case-**sensitive**, so `UPDATE/...` fails closed. Method must be
   POST/PATCH/PUT/DELETE.
3. **`WRITE_REGISTRY` — an allowlist that fails closed.** Every accepted verb×entity is listed once
   with an explicit disposition: `band(...)` (sandbox-floor guarded, with the id sources named) or
   `open(why)` (deliberately exempt, with the reason written down). **Anything unlisted is refused
   with 403.** Lookup is longest-prefix on segment boundaries and **case-insensitive**, because the
   Express-based backend routes `update/WORKFLOW` to the same handler — the inspected set must be a
   superset of what the backend routes, never a subset.
4. **The sandbox floor.** `src/lib/sandbox-floor.ts`: ids `> 999_999_999_999` were minted by the
   sandbox and are safe to write; anything at or below is mirrored from live Loom. For a `band` rule,
   **every declared id source that is present** is checked and all must be above the floor; finding
   *none* is a refusal, not a pass. Ids must match `/^\d+$/` after trimming, so `"1e13"` is refused
   rather than coerced past the floor. Banded writes are additionally refused outright unless
   `BACKEND_URL` resolves to `localhost`/`127.0.0.1`.
5. **Server-derived actor identity.** Two families never accept an actor from the caller:
   - `add/workflow-comment` — `authorName` is written **last** from `getIdentity()`, so a
     caller-supplied one is overwritten rather than merged; unauthenticated → 401.
   - `add|update/element/feedback` and `update/element/feedback/admin` — `resolveSignOff()` supplies
     the tenant, which is set on the **query string**, not the body. This is the documented trap:
     the backend reads `@Query('tenantId')`, so a body `tenantId` is silently ignored and the write
     answers HTTP 200 with `element_feedback.approved_by` left NULL — a sign-off that looks recorded
     and is not. Caller-supplied `tenantId` / `approvedBy` / `uploadedBy` / `uploader` are deleted
     from the body, and on create the signer's name is stamped into `text`.
6. **Failure surface.** Backend status and body are propagated verbatim (a rejected write never
   reads as a success); no service token → 503; unreachable backend → 502.

### 2.2 The dedicated product bridges

| Route | Forwards | Body | Notes |
|---|---|---|---|
| `POST /api/product/create` | `POST /add/fabric-product` \| `/add/finished-product` | `{ type: "fabric"\|"finished", payload }` | The wrapper mints the new id above the sandbox floor |
| `POST /api/product/save` | `PATCH /update/fabric-product` \| `/update/finished-product` | same | Update path; kept separate from create so the two map 1:1 onto the wrapper's endpoints |
| `POST /api/product/upload-image` | `POST /upload/image` | multipart | Attaches the session cookie directly |
| `GET /api/product/check-unique?field=name\|sku&value=` | `GET /check/unique-product/{name\|sku}/{value}` | — | Read-only, public endpoint, no token attached |

These three write bridges attach the **session** cookie (`weave_token`) as the bearer token and send
`Origin: localhost`; `/api/crud` attaches the **service** token instead. `check-unique` sends
neither. Pinned by `src/app/api/product/create/route.test.ts` (13 tests).

### 2.3 The remaining write routes

`POST /api/feedback` and `PATCH|DELETE /api/feedback/[id]` (page-feedback widget),
`POST /api/keywords`, `POST /api/story-mapping/override`, `POST /api/sync/run`,
`POST /api/journey-tests/run`, `POST /api/pr-review/enqueue`, `POST /api/pr-review/merge`,
`POST|DELETE /api/auth/login`. Everything else under `src/app/api/**` is GET-only.

**Untested as of this pass** — see `KNOWN-GAPS.md`. The pr-review, journey-tests and sync routes are
dev tooling that `NEXT_PUBLIC_HIDE_DEV_TOOLS` hides on the public deployment.

### 2.4 Which pages mutate what

| Surface | Client file(s) | Through | Entities written |
|---|---|---|---|
| Catalogue taxonomies | `catalog/{categories,segments,sub-categories}/*Client.tsx`, `components/catalog/SimpleItemCrud.tsx` | `/api/crud` | category, sub-category, segment (open — catalogue reference data) |
| Product profiles | `components/profiles/ProfileCrud.tsx` | `/api/crud` | the seven profile taxonomies |
| Content | `content/{blogs,stories,faqs}/**` incl. `FaqDrawer.tsx` | `/api/crud` | blog/story/FAQ rows and their categories & types |
| Artisans | `artisans/{catalog,skills}/*Client.tsx` | `/api/crud` | artisan catalogue entries, skills |
| Listings / products | `listings/ListingsClient.tsx`, `listings/[id]/ProductEditForm.tsx` | `/api/product/{create,save,upload-image}` **and** `/api/crud` | fabric & finished products |
| Orders | `orders/OrdersClient.tsx`, `orders/[id]/OrderDetailView.tsx` | `/api/crud` | order status, `cancel/order` (DELETE-with-body) |
| Reviews, settings, inventory, logistics, wholesale | the matching `*Client.tsx` | `/api/crud` | reviews, settings rows, inventory adjustments, shipments, wholesale rows |
| ArtisanFlow — templates | `components/artisanflow/{TemplateBuilder,TemplateDeleteButton}.tsx`, `artisanflow/workflow/template/**` | `/api/crud` | workflow templates and their step/subprocess element templates — **all banded** |
| ArtisanFlow — jobs | `components/artisanflow/{StepStatusControl,WorkflowArtisanPanel,ArtisanAssignmentPanel,WorkflowDeleteButton,PipelineSwimlane}.tsx` | `/api/crud` | workflow instances, step status, artisan assignment — **banded** |
| ArtisanFlow — discussion & QC | `components/artisanflow/{DiscussionPanel,WorkflowNotePanel}.tsx`, `artisanflow/workflow/feedback/**` | `/api/crud` | workflow comments (author derived), element feedback (signer derived) |
| ArtisanFlow — custom orders | `artisanflow/custom-orders/{new,manage}/**` incl. `crud.ts` | `/api/crud` | custom orders, custom-order items, adjustments — **banded** |

The write logic lives in these client components, not in a service layer: the branch inlined it when
`src/services/` was removed. `/api/crud` is therefore the only place a write can be reviewed in one
file, which is why it is the one that carries the guards and the tests.
