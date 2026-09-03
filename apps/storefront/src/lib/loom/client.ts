import 'server-only';
import { requireLoomBaseUrl, LOOM_DEFAULT_HEADERS } from './config';
import { rewriteBloomscorpUrlsDeep } from './media';

// ---------------------------------------------------------------------------
// Server-only Loom fetch wrapper (the BFF spine).
// NEVER import this from a client component — `import 'server-only'` will throw.
// Every request injects `Origin: localhost`; when a `token` is passed it injects
// `Authorization: Bearer <token>`. Use `revalidate` for cacheable nav/forex;
// authed/dynamic calls default to `cache: 'no-store'`.
// ---------------------------------------------------------------------------

// ===========================================================================
// DEMO WRITE-GUARD
// This is a PUBLIC preview that talks to LIVE production Loom. Reads are fine;
// writes are not. The ONLY Loom mutations this preview may perform are login
// (/authenticate/email) and adding a cart item on a test account (/add/cart-item).
// Any other Loom POST throws — making the zero-mutation invariant STRUCTURAL,
// so it holds even if someone adds a new route later. Mirrored, and enforced in
// CI, by .harness/zero-mutation-gate.mjs.
// NOTE: the review named the login path '/authenticate'; the live contract is
// actually '/authenticate/email', so the allowlist matches any '/authenticate*'.
// ===========================================================================
// '/check-email/tenant' added 2026-07-06: non-mutating POST-shaped READ (email
// existence probe) -- proven by live probe (registered:true/false, no record
// created, no OTP) and Loom TenantController source; exempted in the wrapper.
// '/add/address' added 2026-07-13: customer self-service address save. add/address
// is CODE_CU customer-scoped, reversible and own-record only (the wrapper mints a
// tenant-owned row and returns its id) — distinct from order/payment writes, which
// stay blocked. NOTE: the sibling CI gate .harness/zero-mutation-gate.mjs keeps a
// DUPLICATE hardcoded allowlist and needs the same '/add/address' entry to stay green.
// '/customer/b2b-profile' added 2026-07-15: authenticated CODE_CU self-service
// SELF-DECLARE WHOLESALE write (captures the business profile + flips b2c->b2b).
// Sandbox-only, own-record, reversible -- SAME category as '/add/address'. The
// sibling CI gate .harness/zero-mutation-gate.mjs keeps a DUPLICATE allowlist and
// carries the same entry to stay green.
// '/customer/registration/email' added 2026-07-16: NATIVE customer registration
// (guest-checkout auto-account). Served by the sandbox wrapper's RegistrationController
// (native pg only, NEVER a live write, verification email SUPPRESSED) -- same
// sandbox-only / own-record category as '/add/address' and '/customer/b2b-profile'.
// The sibling CI gate .harness/zero-mutation-gate.mjs carries the same entry.
// '/send/contact-us' added 2026-07-17: the /contact page's real submit. Served
// NATIVELY by the sandbox wrapper's MiscController -- inserts into its own
// contact_message table (own-record, reversible: just a row delete), NEVER
// sends a real email, and LOOM_BASE_URL resolves to our own wrapper at
// runtime, so this never reaches live Loom. Same sandbox-safe category as
// '/add/address'. Twin entry required in .harness/zero-mutation-gate.mjs.
// '/send/newsletter-subscribe' added 2026-07-17: the footer newsletter signup
// widget. Served NATIVELY by the sandbox wrapper's NewsletterController --
// upserts into its own newsletter_subscription table (own-record, reversible).
// No live Loom endpoint for this has ever existed. Twin entry required in
// .harness/zero-mutation-gate.mjs.
// ---------------------------------------------------------------------------
// 2026-08-16 (REAL CHECKOUT lane) — four new POST paths, ALL served natively by
// the sandbox wrapper's CheckoutController. LOOM_BASE_URL resolves to that
// wrapper (127.0.0.1:8090) at runtime, so none of these can reach live Loom, and
// live Loom has no such routes to reach.
//
// This is a DELIBERATE WIDENING of the guard, not a weakening of it — the
// mechanism is untouched, the four paths are named exactly, and every OTHER
// mutation is still blocked:
//   '/checkout/order'                    create an order (PENDING). Writes ONLY
//        to the sandbox pg (relational.orders + order_item + order_checkout),
//        with the customer identity resolved server-side from the token (or the
//        explicit guest payload). Sandbox order ids are minted >= 1e12 and the
//        service refuses to touch any live-synced row.
//   '/checkout/payment-session'          open a payment session. Behind it is the
//        PaymentProvider seam whose DEFAULT SandboxPaymentProvider does pure
//        local computation — no Razorpay/Stripe SDK, no key, no network egress.
//   '/checkout/payment-callback'         verify the gateway callback and mark the
//        order paid. Signature-verified server-side; a tampered payload is
//        rejected. Idempotent.
//   '/checkout/sandbox-gateway/complete' the MOCKED third party (stands in for
//        the buyer paying on the gateway's modal). The backend 404s it whenever
//        the active provider is not the sandbox one, so it disappears by itself
//        the moment a real gateway is wired in.
//
// The SIX Loom-path gateway ACTION routes (/create/payment-session,
// /create/stripe/payment-session, /update/payment/success, /update/payment/
// failure, /update/payment/transaction, /checkout/stripe/webhook) are STILL NOT
// allowlisted here and stay behind the wrapper's PAYMENT_GATEWAY_ENABLED
// kill-switch. Nothing in this storefront may call them.
//
// NOTE: the sibling CI gate .harness/zero-mutation-gate.mjs keeps a DUPLICATE
// hardcoded allowlist and carries the same four entries to stay green.
// ---------------------------------------------------------------------------
// 2026-08-16 (PASSWORDLESS EMAIL-CODE SIGN-IN) — two new POST paths, both served
// NATIVELY by the sandbox wrapper's EmailCodeController (LOOM_BASE_URL resolves
// to that wrapper, and live Loom has no such routes to reach):
//   '/auth/email-code/request'  issue a 6-digit sign-in code. Writes ONLY to the
//        sandbox-owned relational.email_signin_code (a HASH, never the code) and
//        relational.outbound_email (delivered=false — nothing is sent).
//   '/auth/email-code/verify'   exchange the code for the SAME { jwt } shape
//        /authenticate/email returns. Same category as the '/authenticate*'
//        prefix that is already allowlisted: it is a sign-in, not a data write.
// Twin entry required in .harness/zero-mutation-gate.mjs.
// ---------------------------------------------------------------------------
const ALLOWED_POST_EXACT = new Set<string>(['/add/cart-item', '/check-email/tenant', '/add/address', '/customer/b2b-profile', '/customer/registration/email', '/send/contact-us', '/send/newsletter-subscribe', '/checkout/order', '/checkout/payment-session', '/checkout/payment-callback', '/checkout/sandbox-gateway/complete', '/auth/email-code/request', '/auth/email-code/verify',
  // THE BUYER-TYPE DECLARATION ("Who do you buy for?"). Same sandbox-safe
  // category as '/customer/b2b-profile': CODE_CU, the caller's OWN record,
  // reversible from the account page, and never a live-Loom write.
  // '/customer/signup-details' is the SAME record written from the (now wholly
  // optional) signup screen -- one round trip for the optional name, the optional
  // business opt-in and its optional sourcing hint. Identical blast radius.
  '/customer/buyer-type', '/customer/buyer-type/prompt', '/customer/signup-details',
  // Password reset. Both are ANONYMOUS by necessity — the holder of a reset link
  // has no session yet — and both are safe to expose: /send/password-reset/email
  // answers identically for a registered and an unregistered address (no
  // membership oracle), and /reset/password is useless without a token that is
  // stored hashed, single-use and 30-minute-expiring on the API side.
  '/send/password-reset/email', '/reset/password']);
const ALLOWED_POST_PREFIXES = ['/authenticate'];

// Non-POST customer self-service writes (PATCH/PUT/DELETE), SAME sandbox-safe
// category as the '/add/cart-item' / '/add/address' POST exemptions: CODE_CU,
// own-record, reversible, and additionally floor-guarded server-side (the native
// cart.service refuses to touch any id <= SANDBOX_FLOOR; wishlist is a per-tenant
// CSV column). Added 2026-07-17 to wire the existing cart quantity/remove +
// wishlist-remove backend routes to the UI. (method, path-test) pairs.
// UPDATE 2026-07-18: the sibling CI gate .harness/zero-mutation-gate.mjs used to
// only inspect POST, so these three were out of its scope by construction --
// that's now fixed (the gate's call-site detector was multi-line-blind and got
// repaired, which also exposed loomPut/loomPatch/loomDelete calls it had never
// been checking at all). The gate now carries its OWN narrow call-site allowlist
// (ALLOWED_MUTATING_SITES: loomDelete@app/api/cart/remove/route.ts,
// loomPatch@app/api/cart/update/route.ts, loomPut@app/api/profile/wishlist/remove/route.ts)
// that permits exactly these three (helper, file, path) combinations -- the twin
// of this ALLOWED_WRITE list. Keep both in sync if this list ever changes.
const ALLOWED_WRITE: { method: string; test: (p: string) => boolean }[] = [
  { method: 'PATCH', test: (p) => p === '/update/cart-item' },
  { method: 'DELETE', test: (p) => /^\/delete\/cart-item\/\d+$/.test(p) },
  { method: 'PUT', test: (p) => p.startsWith('/manage/wishlist/') },
];

function assertWriteAllowed(method: string, path: string): void {
  const clean = (path.startsWith('/') ? path : '/' + path).split('?')[0];
  const allowed = ALLOWED_WRITE.some((w) => w.method === method && w.test(clean));
  if (!allowed) {
    throw new LoomWriteBlockedError('Demo write-guard: ' + method + ' ' + clean + ' is not allowed', clean);
  }
}

export class LoomWriteBlockedError extends Error {
  path: string;
  constructor(message: string, path: string) {
    super(message);
    this.name = 'LoomWriteBlockedError';
    this.path = path;
  }
}

function assertPostAllowed(path: string): void {
  const clean = (path.startsWith('/') ? path : '/' + path).split('?')[0];
  const allowed =
    ALLOWED_POST_EXACT.has(clean) || ALLOWED_POST_PREFIXES.some((p) => clean.startsWith(p));
  if (!allowed) {
    throw new LoomWriteBlockedError('Demo write-guard: POST ' + clean + ' is not allowed', clean);
  }
}

export interface LoomRequestOptions {
  /** Loom JWT bearer token (omit for unauthenticated public endpoints). */
  token?: string;
  /** ISR revalidate seconds for cacheable GETs (nav, forex). Omit ⇒ no-store. */
  revalidate?: number;
  /** Next.js fetch cache tags — lets an on-demand revalidateTag() drop just this data. */
  tags?: string[];
  /** Extra headers to merge. */
  headers?: Record<string, string>;
  /** AbortSignal passthrough. */
  signal?: AbortSignal;
}

export class LoomError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'LoomError';
    this.status = status;
    this.body = body;
  }
}

function buildHeaders(opts?: LoomRequestOptions, hasBody = false): HeadersInit {
  const h: Record<string, string> = { ...LOOM_DEFAULT_HEADERS, ...(opts?.headers || {}) };
  if (hasBody) h['Content-Type'] = 'application/json';
  if (opts?.token) h['Authorization'] = 'Bearer ' + opts.token;
  return h;
}

function nextOpts(
  opts?: LoomRequestOptions,
): { cache?: RequestCache; next?: { revalidate: number; tags?: string[] } } {
  // Cacheable only for unauthenticated GETs that explicitly pass a revalidate window.
  if (opts?.revalidate != null && !opts.token) {
    return { next: { revalidate: opts.revalidate, ...(opts.tags ? { tags: opts.tags } : {}) } };
  }
  return { cache: 'no-store' };
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    const parsed = JSON.parse(text);
    return rewriteBloomscorpUrlsDeep(parsed) as T;
  } catch {
    // Some endpoints (e.g. check-email/tenant) can return empty / non-JSON — tolerate it.
    return text as unknown as T;
  }
}

export async function loomGet<T = unknown>(path: string, opts?: LoomRequestOptions): Promise<T> {
  const url = requireLoomBaseUrl() + (path.startsWith('/') ? path : '/' + path);
  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(opts),
    signal: opts?.signal,
    ...nextOpts(opts),
  });
  const data = await parse<T>(res);
  if (!res.ok) throw new LoomError('Loom GET ' + path + ' failed (' + res.status + ')', res.status, data);
  return data;
}

export async function loomPost<T = unknown, B = unknown>(
  path: string,
  body: B,
  opts?: LoomRequestOptions,
): Promise<T> {
  // DEMO WRITE-GUARD: block every Loom mutation except the allowlisted paths.
  assertPostAllowed(path);
  const url = requireLoomBaseUrl() + (path.startsWith('/') ? path : '/' + path);
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(opts, true),
    body: body == null ? undefined : JSON.stringify(body),
    signal: opts?.signal,
    cache: 'no-store',
  });
  const data = await parse<T>(res);
  if (!res.ok) throw new LoomError('Loom POST ' + path + ' failed (' + res.status + ')', res.status, data);
  return data;
}

// PATCH / PUT / DELETE — customer self-service writes only (see ALLOWED_WRITE).
async function loomWrite<T = unknown, B = unknown>(
  method: 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  body: B | undefined,
  opts?: LoomRequestOptions,
): Promise<T> {
  assertWriteAllowed(method, path);
  const url = requireLoomBaseUrl() + (path.startsWith('/') ? path : '/' + path);
  const res = await fetch(url, {
    method,
    headers: buildHeaders(opts, body != null),
    body: body == null ? undefined : JSON.stringify(body),
    signal: opts?.signal,
    cache: 'no-store',
  });
  const data = await parse<T>(res);
  if (!res.ok) throw new LoomError('Loom ' + method + ' ' + path + ' failed (' + res.status + ')', res.status, data);
  return data;
}

export async function loomPatch<T = unknown, B = unknown>(path: string, body: B, opts?: LoomRequestOptions): Promise<T> {
  return loomWrite<T, B>('PATCH', path, body, opts);
}
export async function loomPut<T = unknown, B = unknown>(path: string, body: B | undefined, opts?: LoomRequestOptions): Promise<T> {
  return loomWrite<T, B>('PUT', path, body, opts);
}
export async function loomDelete<T = unknown>(path: string, opts?: LoomRequestOptions): Promise<T> {
  return loomWrite<T, undefined>('DELETE', path, undefined, opts);
}
