import 'server-only';
import { loomGet, loomPost, LoomError } from './client';

// ---------------------------------------------------------------------------
// Typed Loom endpoint wrappers (foundation set).
// Response shapes are modelled from live-verified payloads. Loom often returns
// extra fields; types capture the load-bearing ones and stay permissive.
// ---------------------------------------------------------------------------

// ---- Navigation ----------------------------------------------------------
export interface NavOption {
  id: number;
  subCategoryName: string;
  subCategoryFeaturedImage?: string;
}
export interface NavSegment {
  id: number;
  segmentCategoryName: string;
  optionList: NavOption[];
}
export interface NavSegmentResponse {
  entity: NavSegment[];
  success?: boolean;
}

export interface NavMaterial { materialId: number; materialName: string }
export interface NavColor { colorId: number; colorLabel: string; colorHexCode: string }
export interface NavPattern { patternId: number; patternName: string }

export type FabricNavKind = 'craft' | 'material' | 'color' | 'pattern';

// Discriminated return: craft -> segments; material/color/pattern -> flat lists.
export interface FabricNavResult {
  craft?: NavSegment[];
  material?: NavMaterial[];
  color?: NavColor[];
  pattern?: NavPattern[];
}

const NAV_REVALIDATE = 3600;

// ---------------------------------------------------------------------------
// Sanitize at the boundary: live Loom always populates these name fields, but
// the local sandbox wrapper (Postgres-backed, used only by storefront-sandbox)
// can legitimately have a null category/segment/subCategory NAME on a row
// whose taxonomy id changed after an edit (products.service.ts nulls the
// stale flat name column rather than show the WRONG old name — see that
// file's writeColumns comment). The types below declare these as `string`,
// but the raw payload can violate that, and SiteHeader (slug()/toLowerCase())
// assumes the type is honest — so coerce null/undefined to '' right here,
// once, instead of guarding every downstream .toLowerCase() call site.
// ---------------------------------------------------------------------------
function sanitizeSegments(list: unknown[]): NavSegment[] {
  return (list as NavSegment[]).map((seg) => ({
    ...seg,
    segmentCategoryName: seg.segmentCategoryName ?? '',
    optionList: (seg.optionList ?? []).map((o) => ({
      ...o,
      subCategoryName: o.subCategoryName ?? '',
    })),
  }));
}
function sanitizeMaterial(list: unknown[]): NavMaterial[] {
  return (list as NavMaterial[]).map((m) => ({ ...m, materialName: m.materialName ?? '' }));
}
function sanitizeColor(list: unknown[]): NavColor[] {
  return (list as NavColor[]).map((c) => ({ ...c, colorLabel: c.colorLabel ?? '' }));
}
function sanitizePattern(list: unknown[]): NavPattern[] {
  return (list as NavPattern[]).map((p) => ({ ...p, patternName: p.patternName ?? '' }));
}

export async function getNavFabric(kind: FabricNavKind): Promise<FabricNavResult> {
  const res = await loomGet<{ entity: unknown[] }>('/get/navigation/fabric/' + kind, {
    revalidate: NAV_REVALIDATE,
  });
  const entity = (res?.entity ?? []) as unknown[];
  switch (kind) {
    case 'craft':    return { craft: sanitizeSegments(entity) };
    case 'material': return { material: sanitizeMaterial(entity) };
    case 'color':    return { color: sanitizeColor(entity) };
    case 'pattern':  return { pattern: sanitizePattern(entity) };
  }
}

export async function getNavFinished(category: string): Promise<NavSegment[]> {
  const res = await loomGet<NavSegmentResponse>('/get/navigation/finished/' + category, {
    revalidate: NAV_REVALIDATE,
  });
  return sanitizeSegments(res?.entity ?? []);
}

export async function getNavStory(category: string): Promise<NavSegment[]> {
  const res = await loomGet<NavSegmentResponse>('/get/navigation/story/' + category, {
    revalidate: NAV_REVALIDATE,
  });
  return res?.entity ?? [];
}

// ---- Forex ---------------------------------------------------------------
export interface ForexRate {
  recordDate: number;
  gbp: number;
  eur: number;
  usd: number;
  createdAt?: number;
  id?: number;
  version?: number;
}
export interface ForexResponse {
  success: boolean;
  message?: string;
  forexExchangeRate: ForexRate;
}

export async function getForex(): Promise<ForexRate | null> {
  try {
    const res = await loomGet<ForexResponse>('/get/forex-exchange-rate/latest', {
      revalidate: NAV_REVALIDATE,
    });
    return res?.forexExchangeRate ?? null;
  } catch {
    return null;
  }
}

/**
 * The studio's PER-MARKET COMMERCIAL UPLIFT (Loom's `forex` table).
 *
 * Live composes TWO stored numbers to price a foreign order — the daily market
 * rate above, MULTIPLIED by this per-market uplift (1.25 for USD/GBP/EUR, 1 for
 * INR). Fetching only the first one under-prices every foreign sale by 20%.
 * See fabric/src/app/pipe/currency-converter.pipe.ts.
 */
export interface ForexListItem {
  country: string;
  currency: string;
  rate: number;
  id?: number;
  version?: number;
}
export interface ForexListResponse {
  success: boolean;
  message?: string;
  forexList: ForexListItem[];
}

export async function getForexList(): Promise<ForexListItem[]> {
  try {
    const res = await loomGet<ForexListResponse>('/get/forex-list', {
      revalidate: NAV_REVALIDATE,
    });
    return Array.isArray(res?.forexList) ? res.forexList : [];
  } catch {
    return [];
  }
}

// ---- Authed (bearer token) ----------------------------------------------
export async function getDiscountList(token: string): Promise<unknown> {
  return loomGet('/get/discount-list', { token });
}

export interface CartItem {
  id?: number;
  productId?: number;
  quantity?: number;
  [k: string]: unknown;
}
export interface CartResponse {
  entity?: CartItem[];
  success?: boolean;
  [k: string]: unknown;
}
export async function getCart(token: string): Promise<CartResponse> {
  return loomGet<CartResponse>('/get/cart-item/list', { token });
}

export interface CustomerProfile {
  id?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  [k: string]: unknown;
}
export interface CustomerProfileResponse {
  entity?: CustomerProfile;
  success?: boolean;
  [k: string]: unknown;
}
export async function getCustomerProfile(token: string): Promise<CustomerProfileResponse> {
  return loomGet<CustomerProfileResponse>('/get/customer/profile', { token });
}

// ---- Address (CODE_CU customer self-service write) ------------------------
// POST /add/address — the wrapper mints a tenant-owned address row and returns
// { success, message } where, on success, `message` carries the NEW address id.
// Own-record only; the token scopes it to the logged-in customer. Not an
// order/payment write (those stay blocked by the demo write-guard).
export interface AddAddressResult { success: boolean; message: string; [k: string]: unknown }
export async function addAddress(
  token: string,
  body: Record<string, unknown>,
): Promise<AddAddressResult> {
  return loomPost<AddAddressResult>('/add/address', body, { token });
}

// ---- Native customer registration (guest-checkout auto-account) -----------
// POST /customer/registration/email -- the sandbox wrapper's RegistrationController
// creates a native customer in sandbox pg (bcrypt-hashed password in the OWNED
// credential store) and kicks off a SUPPRESSED verification email (nothing is
// delivered; nothing is written to live Loom). Loom's request body nests the
// fields under a nested tenant object; the response is RainTreeResponse { success, message }:
//   success  -> { success:true,  message:'A new customer is created' }
//   dup email -> { success:false, message:'A user is already registered with this email address' }
//   invalid   -> { success:false, message:'incorrect information' }
// Sandbox-only, own-record -- same demo-write category as addAddress.
export interface RegisterEmailResult { success: boolean; message: string; [k: string]: unknown }
export async function registerEmail(input: {
  name: string;
  email: string;
  password: string;
  gender?: string;
}): Promise<RegisterEmailResult> {
  return loomPost<RegisterEmailResult>('/customer/registration/email', {
    tenant: {
      name: input.name,
      email: input.email,
      password: input.password,
      gender: input.gender || 'UNDEFINED',
    },
  });
}

// ---- Email tenant check (tolerate empty / non-JSON) ----------------------
export async function checkEmailTenant(email: string): Promise<unknown> {
  try {
    return await loomGet('/check-email/tenant?email=' + encodeURIComponent(email));
  } catch {
    return null;
  }
}

/** TRUE when the email already belongs to a REAL (login-able) account.
 *  POST-shaped READ — /check-email/tenant creates nothing (allowlisted in the
 *  write-guard for exactly that reason). Used by the GUEST checkout to offer
 *  "sign in to continue" to a returning buyer BEFORE anything is written. */
export async function checkEmailRegistered(email: string): Promise<boolean> {
  const data = await loomPost<{ entity?: { registered?: boolean }; success?: boolean }>(
    '/check-email/tenant',
    { email },
  );
  return data?.entity?.registered === true;
}

// ---- Auth ----------------------------------------------------------------
// NOTE: the field is `username` (not `email`) per the verified live contract.
export interface AuthSuccess { jwt: string; success?: boolean; [k: string]: unknown }
export interface AuthFailure { success: false; message: string }
// `code` lets the API route pick the right HTTP status: a genuine credential
// rejection -> 401, a backend/tunnel outage -> 503.
// `passwordless` is the backend telling us the account signs in with an emailed
// code and has NO password that could ever match. Dropping it here (which this
// type used to do) left the sign-in UI unable to branch, so a passwordless buyer
// got a generic "login failed" in front of a box they can never satisfy.
export type AuthResult =
  | { ok: true; jwt: string; raw: AuthSuccess }
  | { ok: false; message: string; code: 'rejected' | 'unavailable'; passwordless?: boolean };

// Shown when the backend is unreachable / erroring — NOT a credential problem.
// Kept as a named export so the route + tests assert on the same string.
export const AUTH_UNAVAILABLE_MESSAGE =
  'Sign-in is temporarily unavailable — please try again in a few minutes.';

export async function authenticateEmail(username: string, password: string): Promise<AuthResult> {
  try {
    const res = await loomPost<AuthSuccess>('/authenticate/email', { username, password });
    if (res && typeof res.jwt === 'string' && res.jwt.length > 0) {
      return { ok: true, jwt: res.jwt, raw: res };
    }
    // 2xx but no JWT: the backend answered and declined — treat as a rejection.
    const msg = (res as unknown as AuthFailure)?.message || 'Authentication failed.';
    const pwless = (res as unknown as { passwordless?: boolean })?.passwordless === true;
    return { ok: false, message: msg, code: 'rejected', passwordless: pwless };
  } catch (e: unknown) {
    // Distinguish a genuine credential rejection from a backend outage. Blaming the
    // user's password when the tunnel/backend is down is misleading, so only surface a
    // credential message when Loom actually answered with a client-error status AND a
    // parsed body message. Everything else (5xx, empty body, thrown fetch) => outage.
    if (e instanceof LoomError) {
      const body = e.body as (Partial<AuthFailure> & { passwordless?: boolean }) | undefined;
      const msg = typeof body?.message === 'string' ? body.message : '';
      if (e.status >= 400 && e.status < 500 && msg) {
        return { ok: false, message: msg, code: 'rejected', passwordless: body?.passwordless === true };
      }
      return { ok: false, message: AUTH_UNAVAILABLE_MESSAGE, code: 'unavailable' };
    }
    // fetch() threw (DNS / connection refused / timeout / abort) => backend unreachable.
    return { ok: false, message: AUTH_UNAVAILABLE_MESSAGE, code: 'unavailable' };
  }
}
