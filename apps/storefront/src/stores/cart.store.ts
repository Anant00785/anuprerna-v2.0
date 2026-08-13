import { create } from "zustand";
import { Cart } from "@/types/domain/cart";
import { cartRepository } from "@/lib/api/repositories/cart.repository";

// Loom owns the cart: it is keyed to the bearer token, not to this browser, so
// this store is a cache of the server's answer plus the drawer's open/closed
// flag. Deliberately NOT `persist`-backed — persisting would both go stale
// against Loom and leak one customer's cart to the next user of the browser.
// Nothing is read before the first `refresh()`, so server and first client
// render agree (itemCount 0) and there is no hydration mismatch to gate.

type CartState = {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
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
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      // cartRepository.getCart swallows transport failures and returns an empty
      // cart, so this only ever throws on a programming error.
      const cart = await cartRepository.getCart();
      set({ cart, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || "Could not load your cart.", isLoading: false });
    }
  },
  clear: () => set({ cart: null, error: null }),
}));

/** Total units in the cart, 0 before the first load. */
export function selectCartItemCount(state: CartState): number {
  return state.cart?.itemCount ?? 0;
}
