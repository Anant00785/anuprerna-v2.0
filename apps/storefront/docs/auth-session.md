# Auth and session

**Owns:** who the browser is, for the whole storefront.
**Files:** `src/app/api/auth/**`, `src/lib/auth/token-helper.ts`, `src/lib/loom/{config,client,endpoints,token}.ts`,
`src/components/auth/AuthProvider.tsx`, `src/lib/buyer-mode.ts`.

The storefront **never** authenticates anybody itself. It relays credentials to the backend, parks
the backend's JWT in an httpOnly cookie, and asks itself who that cookie is on every page load. The
file-based user store that used to sit here is gone; `src/app/api/auth/login/route.test.ts` pins that
with a filesystem assertion over `src/lib/auth/`.

## Password login, end to end

| Step | Where | What happens |
|---|---|---|
| 1 | `AuthProvider.login()` (`components/auth/AuthProvider.tsx`) | `POST /api/auth/login` with `{ email, password }`. The client never sees a JWT. |
| 2 | `app/api/auth/login/route.ts` | Lower-cases and trims the email; 400s if either field is empty **before** any network call. |
| 3 | `lib/loom/endpoints.ts` → `authenticateEmail()` → `loomPost('/authenticate/email', …)` | POSTs `{ username, password }` — the two fields Loom's `NverseAuthenticationController` binds — to `LOOM_BASE_URL`, with `Origin: localhost`. |
| 4 | back in the login route | On success sets the `loom_jwt` cookie: `httpOnly`, `sameSite=lax`, `path=/`, `maxAge` 14 days, `secure` only when `NODE_ENV === 'production'`. Answers `{ success: true }` and nothing else. |
| 5 | `AuthProvider.login()` | Replays the guest cart (`mergeGuestCartOnLogin()`, best-effort, never blocks the login — see [`cart-and-checkout.md`](./cart-and-checkout.md)), then calls `refresh()`. |
| 6 | `app/api/auth/me/route.ts` | Reads the httpOnly cookie server-side and answers `{ authenticated, profile? }`. |

Failure behaviour of step 3/4:

| Backend answer | Route answers | Session cookie |
|---|---|---|
| credentials rejected | `401 { success:false, message, passwordless }` | not set |
| unreachable / network error (`result.code === 'unavailable'`) | `503` | not set |
| missing email or password | `400` | not set |

`passwordless: true` tells the UI the account signs in by emailed code and has no password that could
ever match, so it switches lanes instead of asking for the password again.

## `GET /api/auth/me` — the session read

Order of checks in `app/api/auth/me/route.ts`:

1. **No `loom_jwt` cookie** → `{ authenticated: false }`. No backend call.
2. **`isWrapperToken()` false** (`lib/loom/token.ts`) → `clearedSession()`: expires `loom_jwt`
   (`maxAge: 0`) *and* resets `ap_buyer_mode` to `guest`, then `{ authenticated: false }`. A stale or
   foreign cookie is torn down rather than left to look logged-in.
3. **`verifyToken()` returns `{ ok: false, reason: 'expired' }`** — our own token, past its `exp` →
   `clearedSession()` as well. The token is genuinely ours, so falling through to step 4 would answer
   `authenticated: false` while leaving the dead cookie in place, and every later request would
   repeat the same wasted round trip. The session actually ends.
4. **`verifyToken()` returns a payload with `email` and `name`** → the passwordless identity
   is read straight out of the token. This is safe *only* because `verifyToken` checks the HMAC and
   the expiry first (below); a forged token falls through to step 5 instead.
5. **Otherwise** → `getCustomerProfile(token)` → Loom `GET /get/customer/profile` with the bearer
   token. The response is unwrapped from either `entity` (live Loom) or `customer` (native wrapper).
6. **Any throw in step 5** → `{ authenticated: false }`. There is no partial session state.

Steps 4 and 5 both set the non-httpOnly `ap_buyer_mode` cookie (`b2b` when `profile.buyerType === 'b2b'`,
otherwise `b2c`) so `BuyerModeProvider` can read it from `document.cookie`. `POST /api/auth/logout`
deletes `loom_jwt` and resets that cookie to `guest`.

### `isWrapperToken` does less than its comment claims

The comment above `isWrapperToken` (`lib/loom/token.ts`) says it requires cleartext `customerId` and
`roles` claims. **It does not.** The implementation only checks that the value has three
dot-separated segments and that segment 2 base64-decodes to a JSON object. It is a shape probe, not
an auth decision — the real check is the HMAC in `decodeTokenPayload` and, for pass-through reads,
the backend's own verification. Recorded in `docs/KNOWN-GAPS.md`.

## `lib/auth/token-helper.ts` — the wrapper-minted JWT

The passwordless lane is entirely self-contained: `POST /api/auth/email-code/request` writes a
6-digit code into `lib/auth/otp-store.ts` — a `Map` on the Node `global`, in memory, per process —
and `POST /api/auth/email-code/verify` compares it, mints a session token itself and sets `loom_jwt`.
No backend is consulted at verify time, and the identity is derived from the email local-part.

**That store is process-local and non-durable, and this is not a theoretical concern.** It is a
plain `Map` hung off the Node `global` — there is no file, no database and no cache behind it. So:
every outstanding sign-in code is **lost on any restart or redeploy**, and a code issued by one
instance **cannot be read by another**. Passwordless login therefore works only on a single,
continuously warm instance. On Vercel, where each request may land on a different lambda and lambdas
are recycled freely, a buyer can request a code and then be unable to use it. Recorded in
`docs/KNOWN-GAPS.md`; not fixed here — a durable store is a backend decision, not a storefront one.

`signToken()` mints an HS256 JWS (`{alg:"HS256",typ:"JWT"}` header, base64url payload, HMAC-SHA256
signature). Its only caller is `app/api/auth/email-code/verify/route.ts`, the passwordless lane: the
storefront mints the session token there itself rather than getting one from Loom.

`verifyToken()` is the single verification entry point. It checks the HMAC with a `timingSafeEqual`
after a length check, **then** enforces `exp`, and reports the two failures separately —
`{ ok: false, reason: 'expired' }` for a token that is ours but finished, `'invalid'` for everything
else — so `/api/auth/me` can tear the cookie down in the first case and fall through to Loom in the
second.

`decodeTokenPayload()` is the thin wrapper over it: payload or `null`. It returns `null` — never a
payload — for:

- a payload swapped under an otherwise-valid signature (the privilege-escalation case),
- a token signed with a different secret,
- an `alg: "none"` token, however well-formed,
- a real Loom token (opaque `sub`, someone else's signature) — it falls through to the profile fetch,
- anything that is not exactly three segments,
- a verified token whose payload is not JSON,
- **a correctly signed token whose `exp` has passed** — `>=`, so a token expiring exactly now is
  already dead,
- **a correctly signed token with no `exp` at all**, or a non-numeric / non-finite one. A session
  with no stated lifetime is the same defect as one that never expires, and nothing this server
  mints omits the claim.

All six are pinned in `src/lib/auth/token-helper.test.ts`; the "forged token must not become a
profile" case is pinned end-to-end in `src/app/api/auth/me/route.test.ts`.

Expiry is enforced **in the helper, not at the call site**, so every present and future caller of
`verifyToken`/`decodeTokenPayload` refuses an expired token by construction. `/api/auth/me` is the
only call site today. The cookie's own 14-day `maxAge` is a client-side convenience and is no longer
the only thing bounding a session.

## Environment

| Var | Read in | Required | Missing ⇒ |
|---|---|---|---|
| `AUTH_JWT_SECRET` | `lib/auth/token-helper.ts`, per call | **Yes**, for the passwordless lane | `signToken` throws `"AUTH_JWT_SECRET is not configured."`, so `POST /api/auth/email-code/verify` 500s. `verifyToken` catches its own throw and reports `invalid`, so `/api/auth/me` degrades to the Loom profile fetch instead of erroring. There is deliberately **no fallback secret** — a committed one is a published signing key. |
| `LOOM_BASE_URL` | `lib/loom/config.ts`, at module load | No | Defaults to `https://loom-v2.anuprerna.com` — i.e. **live production Loom**. An unset value in a sandbox is not an error, it is a live call. |
| `LOOM_TABLE_EXPLORER_TOKEN` | `app/api/backend/[...path]/route.ts`, per request | No | The `X-Loom-Table-Explorer-Token` header is simply omitted; the legacy backend then rejects the requests that need it. |
| `NODE_ENV` | login route | — | `secure` is left off the session cookie outside production, so local HTTP works. |

The secret is read **per call**, not at module load, because these modules are evaluated during
`next build` where the variable is legitimately absent; throwing at load time would break the build
rather than the request.

## Not documented here because it is not verified

The other routes under `src/app/api/auth/` — `register`, `forgot`, `reset-password`, `verify-email`,
`resend-verification`, `check-email`, `email-code/request`, `email-code/verify` — were **not** read
line by line for this document and carry no tests. Do not assume their behaviour from the four above.
Logged in `docs/KNOWN-GAPS.md`.
