// =====================================================================================
// lib/checkout-session.ts — the SERVER-SIDE checkout session helpers.
//
// TWO httpOnly cookies, both scoped to a checkout in progress:
//
//   ap_guest_checkout  { email, name } for a GUEST who has identified themselves
//                      but has NOT created an account (and never will, unless they
//                      choose to after the purchase). httpOnly so the browser JS
//                      cannot forge it; the BFF is the only reader.
//   ap_guest_order     the guest ORDER-STATUS token minted by the backend when the
//                      order was created. Lets the in-flight payment steps
//                      authorise without the token ever touching client JS. The
//                      SAME token is also handed back once so the buyer gets a
//                      durable /order-status/<token> link they can bookmark.
//
// A LOGGED-IN buyer uses neither: their identity is the loom_jwt cookie, and the
// backend resolves it from the token.
// =====================================================================================
import 'server-only';

export const GUEST_CHECKOUT_COOKIE = 'ap_guest_checkout';
export const GUEST_ORDER_COOKIE = 'ap_guest_order';
// A checkout in progress — deliberately short-lived, not a login substitute.
export const GUEST_CHECKOUT_MAX_AGE = 60 * 60 * 6; // 6h
// The order-status link must outlive the checkout; 30 days matches a typical
// "track your order" window.
export const GUEST_ORDER_MAX_AGE = 60 * 60 * 24 * 30;

export interface GuestIdentity {
  email: string;
  name: string;
}

export function encodeGuest(identity: GuestIdentity): string {
  return Buffer.from(JSON.stringify(identity), 'utf8').toString('base64url');
}

export function decodeGuest(raw: string | undefined): GuestIdentity | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    const email = typeof parsed?.email === 'string' ? parsed.email : '';
    const name = typeof parsed?.name === 'string' ? parsed.name : '';
    return email ? { email, name } : null;
  } catch {
    return null;
  }
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
