// =====================================================================================
// GUEST CART — client-side, localStorage-backed cart for NOT-logged-in visitors.
//
// The account cart (/api/cart/add -> Loom) 403s / 401s anonymous users, so a guest
// gets a purely client-side cart here. Each stored line carries the FULL Loom cart
// body the logged-in Add-to-cart path builds (so it can be replayed verbatim to
// /api/cart/add on login — see mergeGuestCartOnLogin) PLUS display fields (name,
// image, slug, category) so the cart page can render WITHOUT any fetch.
//
// SSR-safe: every localStorage/window access is guarded by `typeof window`.
// =====================================================================================

import { attachTo as attachAttribution } from './ad-attribution';

const STORAGE_KEY = 'anuprerna_guest_cart_v1';
export const GUEST_CART_EVENT = 'anuprerna:guest-cart-updated';

// The exact Loom cart contract the logged-in AddToCartButton path posts.
export interface GuestCartBody {
  fabricProductId?: number;
  finishedProductId?: number;
  quantity: number;
  unit: string;
  price: number;
  selectedFinishId: string;
  selectedFabricId?: number;
  selectedSizeOptionId?: number;
  customSize: Record<string, unknown>;
  sku: string;
  orderType: string; // 'IN_STOCK' | 'PRE_ORDER'
  productGroup: string; // 'fabric' | 'finished'
  makingCharge: number;
}

// A stored guest line = the replayable body + display fields + a stable key.
export interface GuestCartItem extends GuestCartBody {
  key: string;
  name?: string;
  image?: string;
  slug?: string;
  category?: string; // PDP category segment, e.g. 'fabric-product'
  addedAt: number;
}

// Input to addItem: the body + display fields, WITHOUT the derived key/addedAt.
export type GuestCartInput = GuestCartBody & {
  name?: string;
  image?: string;
  slug?: string;
  category?: string;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

// A line identity that keeps a CUSTOMISED variant (finish/fabric picked) distinct
// from the plain one, and distinct in-stock vs pre-order lines separate.
function keyOf(b: GuestCartBody): string {
  const recordId = b.productGroup === 'fabric' ? b.fabricProductId : b.finishedProductId;
  return [
    b.productGroup,
    recordId ?? '',
    b.orderType,
    b.unit,
    b.selectedFinishId || '',
    b.selectedFabricId ?? '',
    b.selectedSizeOptionId ?? '',
    // custom-size makes an otherwise-identical line distinct (different measurements).
    b.customSize && Object.keys(b.customSize).length > 0 ? JSON.stringify(b.customSize) : '',
  ].join('|');
}

function read(): GuestCartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: GuestCartItem[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota / private-mode — ignore */
  }
  emitChange();
}

function emitChange(): void {
  if (!isBrowser()) return;
  try {
    window.dispatchEvent(new CustomEvent(GUEST_CART_EVENT));
    // Also fire the generic cart-updated signal the logged-in path uses, so any
    // listener wired for it can react to guest changes too.
    window.dispatchEvent(new CustomEvent('anuprerna:cart-updated'));
  } catch {
    /* ignore */
  }
}

/** All guest lines (empty array on server / when nothing stored). */
export function list(): GuestCartItem[] {
  return read();
}

/** Sum of line quantities — for a badge / count. */
export function count(): number {
  return read().reduce((n, it) => n + (it.quantity || 0), 0);
}

/** Add a line. If an identical line (same key) exists, ITS quantity is increased. */
export function addItem(input: GuestCartInput): GuestCartItem[] {
  const items = read();
  const key = keyOf(input);
  const existing = items.find((it) => it.key === key);
  if (existing) {
    existing.quantity = +(existing.quantity + input.quantity).toFixed(2);
    // Refresh price/display in case the customised price changed since last add.
    existing.price = input.price;
    existing.makingCharge = input.makingCharge;
    if (input.name) existing.name = input.name;
    if (input.image) existing.image = input.image;
    if (input.slug) existing.slug = input.slug;
    if (input.category) existing.category = input.category;
  } else {
    items.push({ ...input, key, addedAt: Date.now() });
  }
  write(items);
  return items;
}

/** Set a line's quantity (removes the line when qty <= 0). */
export function updateQty(key: string, quantity: number): GuestCartItem[] {
  let items = read();
  if (quantity <= 0) {
    items = items.filter((it) => it.key !== key);
  } else {
    items = items.map((it) => (it.key === key ? { ...it, quantity } : it));
  }
  write(items);
  return items;
}

/** Remove a line. */
export function removeItem(key: string): GuestCartItem[] {
  const items = read().filter((it) => it.key !== key);
  write(items);
  return items;
}

/** Empty the guest cart. */
export function clear(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emitChange();
}

/** Just the replayable Loom bodies (for merge-on-login). */
export function bodies(): GuestCartBody[] {
  return read().map((it) => {
    const b: GuestCartBody = {
      quantity: it.quantity,
      unit: it.unit,
      price: it.price,
      selectedFinishId: it.selectedFinishId,
      customSize: it.customSize || {},
      sku: it.sku,
      orderType: it.orderType,
      productGroup: it.productGroup,
      makingCharge: it.makingCharge,
    };
    if (it.productGroup === 'fabric') b.fabricProductId = it.fabricProductId;
    else b.finishedProductId = it.finishedProductId;
    if (it.selectedFabricId) b.selectedFabricId = it.selectedFabricId;
    if (it.selectedSizeOptionId) b.selectedSizeOptionId = it.selectedSizeOptionId;
    return b;
  });
}

/** Subscribe to guest-cart changes (in-tab custom event + cross-tab storage).
 *  Returns an unsubscribe fn. No-op on the server. */
export function subscribe(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onEvt = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener(GUEST_CART_EVENT, onEvt);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(GUEST_CART_EVENT, onEvt);
    window.removeEventListener('storage', onStorage);
  };
}

// -------------------------------------------------------------------------------------
// MERGE ON LOGIN — replay every guest line to the account cart, then clear the guest
// cart. Called from AuthProvider.login() right after the JWT cookie is set. Best-effort:
// a failed line does not abort the rest, and merge NEVER blocks a successful login.
// -------------------------------------------------------------------------------------
export async function mergeGuestCartOnLogin(): Promise<{ merged: number; failed: number }> {
  const toMerge = bodies();
  if (toMerge.length === 0) return { merged: 0, failed: 0 };
  let merged = 0;
  let failed = 0;
  for (const body of toMerge) {
    // Stamp the current ad-attribution (gclid/utm_*) onto each replayed line so a
    // guest-added item still carries attribution once it lands in the account cart.
    attachAttribution(body as unknown as Record<string, unknown>);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (res.ok) merged++;
      else failed++;
    } catch {
      failed++;
    }
  }
  // Clear regardless: merged lines now live in the account cart; failed ones are
  // dropped rather than left to double-add on the next login.
  clear();
  return { merged, failed };
}
