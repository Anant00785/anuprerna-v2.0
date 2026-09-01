/**
 * users/[id]/cart/data.ts — SERVER-ONLY fetcher for the per-user "View Cart" drill.
 *
 * Live source (Angular ViewCartComponent + CartTransmissionService):
 *   GET /get/tenant/cart-item/list/{uid}  -> { cartItemList: CartItem[] }  (cart items)
 *   GET /get/tenant/profile/{uid}         -> { tenant: TenantPreview }      (name + decryptedEmail)
 *   (request-mapper.service.ts:368 GET_CART_BY_USER_UID, :109 GET_USER_BY_UID)
 *
 * AUTH — both endpoints are proxied by the :8090 wrapper straight to LIVE Loom,
 * which REJECTS the sandbox admin token ("The credentials have been tampered
 * with"). So, exactly like order-feedback-api, they must run server-side with a
 * genuine live-Loom service token (getLiveLoomToken). Each user cart is small, so
 * we go through the wrapper (BACKEND_URL), not direct-to-live. GET-only — there is
 * no mutation code path here. Returns a discriminated Result<T> so a Loom outage
 * surfaces as an ErrorBanner, never a misleading empty cart.
 */
import type { Result } from "@/lib/result";
import { rewriteBloomscorpUrlsDeep } from "@/lib/media";
import { getSandboxToken } from "@/lib/sandbox-token";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8090";
const ABANDONED_MS = 24 * 3600_000; // live: now - lastUpdatedAt >= 24h

export interface CartTenant {
  uid: string;
  name: string;
  email: string; // decrypted
  emailVerified: boolean;
}

export interface CartItemRow {
  id: number;
  productName: string;
  sku: string;
  heroImage: string;
  slug: string;
  productKind: "fabric-product" | "finished-product" | "unknown";
  productGroup: string; // item-level enum: "swatch" | "fabric" | "finished" ...
  orderType: string;    // enum e.g. "IN_STOCK" | "MADE_TO_ORDER" | "PRE_ORDER"
  quantity: number;
  unit: string;         // "UNIT" | "METER" ...
  lastUpdatedAt: number;
  abandoned: boolean;
  chosenFabric: string; // "Name (SKU)" or ""
  sizeLabel: string;
  sizeDisplayName: string;
  finishLabels: string[];
  finishDisplayName: string;
  customSize: Array<{ key: string; value: string }>;
}

export interface CartSummary {
  cartItemCount: number;
  estimatedTotalPrice: number;
  lastUpdatedAt: number;
  hasAbandonedItem: boolean;
}

export interface CartDrill {
  tenant: CartTenant | null;
  items: CartItemRow[];
  summary: CartSummary | null;
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function productOf(item: Record<string, unknown>): {
  p: Record<string, unknown>;
  kind: CartItemRow["productKind"];
} {
  const fab = item.fabricProductPreview as Record<string, unknown> | undefined;
  const fin = item.finishedProductPreview as Record<string, unknown> | undefined;
  if (fab && fab.product) return { p: fab.product as Record<string, unknown>, kind: "fabric-product" };
  if (fin && fin.product) return { p: fin.product as Record<string, unknown>, kind: "finished-product" };
  return { p: {}, kind: "unknown" };
}

function toItemRow(item: Record<string, unknown>, now: number): CartItemRow {
  const { p, kind } = productOf(item);
  const selFab = item.selectedFabric as Record<string, unknown> | undefined;
  const selFabProd = selFab?.product as Record<string, unknown> | undefined;
  const chosenFabric = selFabProd
    ? `${str(selFabProd.name)} (${str(selFabProd.sku)})`
    : "";
  const size = item.selectedSizeOption as Record<string, unknown> | undefined;
  const finishList = (item.selectedFinishList as Record<string, unknown>[] | undefined) ?? [];
  const cs = (item.customSize as Record<string, unknown> | undefined) ?? {};
  const lastUpdatedAt = Number(item.lastUpdatedAt ?? 0);
  return {
    id: Number(item.id ?? 0),
    productName: str(p.name) || "—",
    sku: str(p.sku),
    heroImage: str(p.heroImage),
    slug: str(p.slug),
    productKind: kind,
    productGroup: str(item.productGroup),
    orderType: str(item.orderType),
    quantity: Number(item.quantity ?? 0),
    unit: str(item.unit),
    lastUpdatedAt,
    abandoned: lastUpdatedAt > 0 && now - lastUpdatedAt >= ABANDONED_MS,
    chosenFabric,
    sizeLabel: size ? str(size.label) : "",
    sizeDisplayName: str(item.sizeDisplayName) || "Size",
    finishLabels: finishList.map((f) => str(f.label)).filter(Boolean),
    finishDisplayName: str(item.finishDisplayName) || "Finish",
    customSize: Object.keys(cs).map((k) => ({ key: k, value: str((cs as Record<string, unknown>)[k]) })),
  };
}

async function loomGet(path: string, token: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", Origin: "localhost", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Loom returned ${res.status}`);
  return rewriteBloomscorpUrlsDeep(await res.json()) as Record<string, unknown>;
}

/**
 * Fetch one user's cart items + tenant header. GET-only, live-token, read-only.
 * A bogus uid returns { cartItemList: [] } / { } from Loom, so this yields a clean
 * empty cart with tenant=null — never an error.
 */
export async function getUserCartDrill(uid: string): Promise<Result<CartDrill>> {
  const token = getSandboxToken();
  if (!token) return { ok: false, error: "Sandbox admin token unavailable" };

  try {
    // Same native, pg-backed source the Users LIST uses (sandbox admin token):
    //   * cart-item/list/{uid}        -> line items (present for sandbox-created carts;
    //                                    historical/blob carts have none in the sandbox).
    //   * cart-item/list?search={uid} -> the admin OVERVIEW row (name + decrypted email +
    //     cartItemCount + estimatedTotalPrice) — the list already exposes these for admin
    //     display, and it is the ONLY place the header identity + summary live for a
    //     historical cart (the tenant/profile endpoint PII-strips the email by design).
    //   * tenant/profile/{uid}        -> name fallback for a native cart with no overview row.
    const [cartJson, overviewJson, profileJson] = await Promise.all([
      loomGet(`/get/tenant/cart-item/list/${encodeURIComponent(uid)}`, token),
      loomGet(`/get/tenant/cart-item/list?pageNumber=0&pageSize=1&search=${encodeURIComponent(uid)}`, token),
      loomGet(`/get/tenant/profile/${encodeURIComponent(uid)}`, token),
    ]);

    const now = Date.now();
    const rawItems = (cartJson.cartItemList as Record<string, unknown>[] | undefined) ?? [];
    const items = rawItems.map((it) => toItemRow(it, now));

    const ov = ((overviewJson.cartOverview as Record<string, unknown>[] | undefined) ?? [])[0];
    const ot = ov?.tenant as Record<string, unknown> | undefined;
    const pt = profileJson.tenant as Record<string, unknown> | undefined;

    // Prefer the admin overview identity (carries the decrypted email); fall back to the
    // profile endpoint for the name (email is PII-stripped there, so it stays blank).
    const tenant: CartTenant | null = ot
      ? {
          uid: str(ot.uid) || uid,
          name: str(ot.name) || "—",
          email: str(ot.decryptedEmail) || str(ot.email),
          emailVerified: Boolean(ot.emailVerified),
        }
      : pt
      ? {
          uid: str(pt.uid) || uid,
          name: str(pt.name) || "—",
          email: str(pt.decryptedEmail) || str(pt.email),
          emailVerified: Boolean(pt.emailVerified),
        }
      : null;

    const summary: CartSummary | null = ov
      ? {
          cartItemCount: Number(ov.cartItemCount ?? 0),
          estimatedTotalPrice: Number(ov.estimatedTotalPrice ?? 0),
          lastUpdatedAt: Number(ov.lastUpdatedAt ?? 0),
          hasAbandonedItem: Boolean(ov.hasAbandonedItem),
        }
      : null;

    return { ok: true, data: { tenant, items, summary } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
