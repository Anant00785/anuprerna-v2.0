import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { useCartStore } from "./cart.store";
import { useHandlers, PROXY_BASE } from "@/test/msw";

const cartRow = {
  id: 166340327,
  quantity: 2,
  unit: "METER",
  productGroup: "fabric",
  makingCharge: 0,
  fabricProductPreview: {
    id: 163523574,
    product: { id: 163523575, name: "Handwoven Fabric", slug: "handwoven", price: 446, unit: "METER" },
  },
};

describe("cart.store", () => {
  beforeEach(() => {
    useCartStore.setState({ cart: null, isOpen: false, isLoading: false, error: null });
  });

  it("starts empty so the header badge renders 0 on the server and first client render", () => {
    expect(useCartStore.getState().cart).toBeNull();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("refresh() loads the cart out of Loom's cartItemList envelope", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/cart-item/list`, () =>
        HttpResponse.json({ cartItemList: [cartRow], success: true, message: "" })
      )
    );
    await useCartStore.getState().refresh();
    const { cart, isLoading } = useCartStore.getState();
    expect(isLoading).toBe(false);
    expect(cart?.itemCount).toBe(2);
    expect(cart?.subtotal).toBe(892);
    expect(cart?.items[0].product.name).toBe("Handwoven Fabric");
  });

  it("refresh() yields an empty cart (not a throw) when the backend fails", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/cart-item/list`, () =>
        HttpResponse.json({ success: false, message: "unauthorized" }, { status: 401 })
      )
    );
    await useCartStore.getState().refresh();
    expect(useCartStore.getState().cart?.itemCount).toBe(0);
  });

  it("open()/close() drive the side tab", () => {
    useCartStore.getState().open();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().close();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("does NOT persist to localStorage — the cart belongs to the bearer token, not the browser", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/cart-item/list`, () =>
        HttpResponse.json({ cartItemList: [cartRow], success: true, message: "" })
      )
    );
    await useCartStore.getState().refresh();
    expect(localStorage.getItem("anuprerna-cart")).toBeNull();
  });
});
