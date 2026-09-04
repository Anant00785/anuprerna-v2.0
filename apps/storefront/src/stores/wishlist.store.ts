import { create } from "zustand";
import { persist } from "zustand/middleware";

import { useToastStore } from "./toast.store";

interface WishlistState {
  skus: string[];
  toggleWishlist: (productName: string, sku: string, showToast?: boolean) => void;
  isInWishlist: (sku: string) => boolean;
  setWishlistFromProfile: (csv: string) => void;
  getWishlistCSV: () => string;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      skus: [],

      toggleWishlist: (productName: string, sku: string, showToast: boolean = true) => {
        if (!sku) return;
        const currentSkus = get().skus;
        const exists = currentSkus.includes(sku);
        const nextSkus = exists
          ? currentSkus.filter((s) => s !== sku)
          : [...currentSkus, sku];

        set({ skus: nextSkus });

        if (showToast) {
          const title = exists
            ? `${productName || "Item"} removed from your wishlist`
            : `${productName || "Item"} added to your wishlist`;
          useToastStore.getState().showToast(title, sku, exists ? "info" : "success");
        }

        // Persist through the native wishlist route (PUT /manage/wishlist/{csv},
        // wrapped by /api/profile/wishlist/set). This used to POST
        // `update/customer/profile` with only a `wishlist` field — the wrong
        // endpoint, so nothing was ever saved and the wishlist page, which reads
        // the profile CSV back, always looked empty.
        //
        // Authentication is the httpOnly `loom_jwt` cookie, which this store
        // cannot read, so the call is made unconditionally and the server
        // rejects it when there is no session. The wishlist stays usable signed
        // out; it just is not persisted to a profile.
        fetch("/api/profile/wishlist/set", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skus: nextSkus }),
        }).catch((err) => {
          console.warn("Failed to sync wishlist to customer profile:", err);
        });
      },

      isInWishlist: (sku: string) => {
        if (!sku) return false;
        return get().skus.includes(sku);
      },

      setWishlistFromProfile: (csv: string) => {
        if (!csv) return;
        const parsed = csv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        set({ skus: Array.from(new Set(parsed)) });
      },

      getWishlistCSV: () => {
        return get().skus.join(",");
      },
    }),
    {
      name: "whaP78jBHY67yBGH5tr98BNhnbvfb", // Match fabric's localStorage key
    }
  )
);
