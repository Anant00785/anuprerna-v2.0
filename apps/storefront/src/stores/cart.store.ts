import { create } from "zustand";
import { persist } from "zustand/middleware";

// EXAMPLE Zustand store — the pattern for CLIENT state (cart, UI toggles, wizard steps).
// Rule: server data stays server-side via lib/api.ts. Do NOT mirror server state here.
// Persisted stores must hold no secrets — this is localStorage.
export type CartItem = { productId: number; qty: number };

type CartState = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set((s) => ({ items: [...s.items, item] })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "anuprerna-cart" },
  ),
);
