import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { useCartStore } from "./cart.store";
import { useHandlers } from "@/test/msw";

const BFF = "http://localhost:3000/api";

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
    useCartStore.setState({ cart: null, isOpen: false, isLoading: false, error: null, needsReauth: false });
  });

  it("starts empty so the header badge renders 0 on the server and first client render", () => {
    expect(useCartStore.getState().cart).toBeNull();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("refresh() loads the cart from the /api/cart BFF route", async () => {
    useHandlers(
      http.get(`${BFF}/cart`, () =>
        HttpResponse.json({ cartItemList: [cartRow], authenticated: true, success: true })
      )
    );
    await useCartStore.getState().refresh();
    const { cart, isLoading } = useCartStore.getState();
    expect(isLoading).toBe(false);
    expect(cart?.itemCount).toBe(2);
    expect(cart?.subtotal).toBe(892);
    expect(cart?.items[0].product.name).toBe("Handwoven Fabric");
  });

  it("refresh() surfaces an auth failure instead of pretending the cart is empty", async () => {
    // The old store swallowed this into an empty cart, so a buyer with items was
    // told their cart was empty. `cart` must stay null and the error must show.
    useHandlers(
      http.get(`${BFF}/cart`, () =>
        HttpResponse.json({ success: false, message: "unauthorized" }, { status: 401 })
      )
    );
    await useCartStore.getState().refresh();
    const { cart, error, needsReauth, isLoading } = useCartStore.getState();
    expect(cart).toBeNull();
    expect(error).toBeTruthy();
    expect(needsReauth).toBe(true);
    expect(isLoading).toBe(false);
  });

  it("refresh() keeps a previously loaded cart when a later read fails", async () => {
    useHandlers(
      http.get(`${BFF}/cart`, () =>
        HttpResponse.json({ cartItemList: [cartRow], authenticated: true, success: true })
      )
    );
    await useCartStore.getState().refresh();
    expect(useCartStore.getState().cart?.itemCount).toBe(2);

    useHandlers(
      http.get(`${BFF}/cart`, () => HttpResponse.json({ success: false }, { status: 502 }))
    );
    await useCartStore.getState().refresh();
    // Still showing the last known-good cart, plus an error — not a false empty.
    expect(useCartStore.getState().cart?.itemCount).toBe(2);
    expect(useCartStore.getState().error).toBeTruthy();
  });

  it("refresh() reports a signed-out session as an empty cart, not an error", async () => {
    useHandlers(
      http.get(`${BFF}/cart`, () => HttpResponse.json({ authenticated: false, entity: [] }))
    );
    await useCartStore.getState().refresh();
    expect(useCartStore.getState().cart?.itemCount).toBe(0);
    expect(useCartStore.getState().error).toBeNull();
  });

  it("open()/close() drive the side tab", () => {
    useCartStore.getState().open();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().close();
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("does NOT persist to localStorage — the cart belongs to the bearer token, not the browser", async () => {
    useHandlers(
      http.get(`${BFF}/cart`, () =>
        HttpResponse.json({ cartItemList: [cartRow], authenticated: true, success: true })
      )
    );
    await useCartStore.getState().refresh();
    expect(localStorage.getItem("anuprerna-cart")).toBeNull();
  });
});
