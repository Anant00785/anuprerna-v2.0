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
});
