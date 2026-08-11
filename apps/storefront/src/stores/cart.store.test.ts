import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./cart.store";

// EXAMPLE co-located store test — every store ships one.
describe("cart.store", () => {
  beforeEach(() => useCartStore.getState().clear());

  it("adds and removes items", () => {
    useCartStore.getState().add({ productId: 1, qty: 2 });
    expect(useCartStore.getState().items).toHaveLength(1);
    useCartStore.getState().remove(1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("appends rather than merges when the same productId is added twice", () => {
    useCartStore.getState().add({ productId: 1, qty: 1 });
    useCartStore.getState().add({ productId: 1, qty: 3 });
    // Characterizes actual behaviour: add() is a plain append with no
    // dedupe/merge-by-productId logic, so the same product can appear twice.
    expect(useCartStore.getState().items).toEqual([
      { productId: 1, qty: 1 },
      { productId: 1, qty: 3 },
    ]);
  });

  it("remove() is a no-op when the productId is not in the cart", () => {
    useCartStore.getState().add({ productId: 1, qty: 2 });
    useCartStore.getState().remove(999);
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("clear() empties the cart regardless of item count", () => {
    useCartStore.getState().add({ productId: 1, qty: 1 });
    useCartStore.getState().add({ productId: 2, qty: 1 });
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("persists items to localStorage under the anuprerna-cart key", () => {
    useCartStore.getState().add({ productId: 5, qty: 1 });
    const raw = localStorage.getItem("anuprerna-cart");
    expect(raw).toContain('"productId":5');
  });
});
