import { create } from "zustand";
import { Cart } from "@/types/domain/cart";
import { cartRepository, CartAuthError } from "@/lib/api/repositories/cart.repository";

// Loom owns the cart: it is keyed to the session, not to this browser, so this
// store is a cache of the server's answer plus the drawer's open/closed flag.
// Deliberately NOT `persist`-backed — persisting would both go stale against
// Loom and leak one customer's cart to the next user of the browser.
// Nothing is read before the first `refresh()`, so server and first client
// render agree (itemCount 0) and there is no hydration mismatch to gate.

type CartState = {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  /** True when the failure was an expired session, so the UI offers sign-in rather than a retry. */
  needsReauth: boolean;
  open: () => void;
  close: () => void;
  /** Re-read the cart from Loom. Safe to call when signed out — yields an empty cart. */
  refresh: () => Promise<void>;
  clear: () => void;
};

export const useCartStore = create<CartState>()((set) => ({
  cart: null,
  isOpen: false,
  isLoading: false,
  error: null,
  needsReauth: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  refresh: async () => {
    set({ isLoading: true, error: null, needsReauth: false });
    try {
      const cart = await cartRepository.getCart();
      set({ cart, isLoading: false, error: null, needsReauth: false });
    } catch (err) {
      // A cart we could not read is NOT an empty cart. Leaving `cart` as-is and
      // surfacing the error stops the drawer from telling a buyer with items
      // that their cart is empty, which is what the old swallow-to-empty did.
      const isAuth = err instanceof CartAuthError;
      set({
        error: isAuth
          ? "Your session has expired — please sign in again."
          : err instanceof Error
            ? err.message
            : "Could not load your cart.",
        needsReauth: isAuth,
        isLoading: false,
      });
    }
  },
  clear: () => set({ cart: null, error: null, needsReauth: false }),
}));

/** Total units in the cart, 0 before the first load. */
export function selectCartItemCount(state: CartState): number {
  return state.cart?.itemCount ?? 0;
}
