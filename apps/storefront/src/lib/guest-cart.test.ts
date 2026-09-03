import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as guestCart from "./guest-cart";
import type { GuestCartInput } from "./guest-cart";

const line = (over: Partial<GuestCartInput> = {}): GuestCartInput => ({
  fabricProductId: 101,
  quantity: 2,
  unit: "metre",
  price: 450.5,
  selectedFinishId: "",
  customSize: {},
  sku: "FAB-101",
  orderType: "IN_STOCK",
  productGroup: "fabric",
  makingCharge: 0,
  name: "Indigo Cotton",
  ...over,
});

beforeEach(() => {
  guestCart.clear();
  localStorage.clear();
});

describe("guest cart line identity", () => {
  it("merges quantities for an identical line instead of duplicating it", () => {
    guestCart.addItem(line({ quantity: 2 }));
    const items = guestCart.addItem(line({ quantity: 1.5 }));

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3.5);
    expect(guestCart.count()).toBe(3.5);
  });

  it("keeps a customised variant separate from the plain one", () => {
    guestCart.addItem(line());
    const items = guestCart.addItem(line({ selectedFinishId: "finish-7" }));
    expect(items).toHaveLength(2);
  });

  it("keeps pre-order separate from in-stock for the same product", () => {
    guestCart.addItem(line());
    expect(guestCart.addItem(line({ orderType: "PRE_ORDER" }))).toHaveLength(2);
  });

  it("keeps two different custom-size measurements as separate lines", () => {
    guestCart.addItem(line({ customSize: { chest: 40 } }));
    expect(guestCart.addItem(line({ customSize: { chest: 42 } }))).toHaveLength(2);
  });

  it("refreshes price and making charge on a re-add so a stale price cannot linger", () => {
    guestCart.addItem(line({ price: 450.5, makingCharge: 0 }));
    const items = guestCart.addItem(line({ price: 500, makingCharge: 75 }));

    expect(items[0].price).toBe(500);
    expect(items[0].makingCharge).toBe(75);
  });

  it("does not accumulate floating-point dust across repeated adds", () => {
    for (let i = 0; i < 3; i++) guestCart.addItem(line({ quantity: 0.1 }));
    expect(guestCart.list()[0].quantity).toBe(0.3);
  });
});

describe("guest cart mutation", () => {
  it("removes the line when the quantity is set to zero or below", () => {
    const key = guestCart.addItem(line())[0].key;
    expect(guestCart.updateQty(key, 0)).toHaveLength(0);

    guestCart.addItem(line());
    expect(guestCart.updateQty(guestCart.list()[0].key, -1)).toHaveLength(0);
  });

  it("ignores an unknown key rather than clearing the cart", () => {
    guestCart.addItem(line());
    expect(guestCart.updateQty("no-such-key", 5)).toHaveLength(1);
    expect(guestCart.removeItem("no-such-key")).toHaveLength(1);
  });

  it("returns an empty cart when localStorage holds something that is not an array", () => {
    localStorage.setItem("anuprerna_guest_cart_v1", JSON.stringify({ hacked: true }));
    expect(guestCart.list()).toEqual([]);
    localStorage.setItem("anuprerna_guest_cart_v1", "{not json");
    expect(guestCart.list()).toEqual([]);
  });

  it("notifies subscribers on change and stops after unsubscribe", () => {
    const cb = vi.fn();
    const off = guestCart.subscribe(cb);
    guestCart.addItem(line());
    expect(cb).toHaveBeenCalled();

    off();
    cb.mockClear();
    guestCart.addItem(line());
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("bodies() — the replayable Loom contract", () => {
  it("sends fabricProductId for a fabric line and drops the display fields", () => {
    guestCart.addItem(line());
    const [body] = guestCart.bodies();

    expect(body.fabricProductId).toBe(101);
    expect(body).not.toHaveProperty("finishedProductId");
    expect(body).not.toHaveProperty("name");
    expect(body).not.toHaveProperty("key");
    expect(body).not.toHaveProperty("addedAt");
  });

  it("sends finishedProductId for a finished line", () => {
    guestCart.addItem(
      line({ productGroup: "finished", fabricProductId: undefined, finishedProductId: 55 })
    );
    const [body] = guestCart.bodies();

    expect(body.finishedProductId).toBe(55);
    expect(body).not.toHaveProperty("fabricProductId");
  });

  it("omits optional selections that were never made", () => {
    guestCart.addItem(line());
    const [body] = guestCart.bodies();
    expect(body).not.toHaveProperty("selectedFabricId");
    expect(body).not.toHaveProperty("selectedSizeOptionId");
  });
});

describe("mergeGuestCartOnLogin", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing (and makes no request) for an empty guest cart", async () => {
    await expect(guestCart.mergeGuestCartOnLogin()).resolves.toEqual({ merged: 0, failed: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("replays every line to the account cart and clears the guest cart", async () => {
    guestCart.addItem(line());
    guestCart.addItem(line({ orderType: "PRE_ORDER" }));
    fetchMock.mockResolvedValue({ ok: true });

    await expect(guestCart.mergeGuestCartOnLogin()).resolves.toEqual({ merged: 2, failed: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/cart/add");
    expect(guestCart.list()).toEqual([]);
  });

  it("counts a rejected line as failed and still replays the rest", async () => {
    guestCart.addItem(line());
    guestCart.addItem(line({ orderType: "PRE_ORDER" }));
    fetchMock.mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });

    await expect(guestCart.mergeGuestCartOnLogin()).resolves.toEqual({ merged: 1, failed: 1 });
  });

  it("never throws (login must not fail) when the network is down, and drops the cart rather than risking a double-add", async () => {
    guestCart.addItem(line());
    fetchMock.mockRejectedValue(new Error("offline"));

    await expect(guestCart.mergeGuestCartOnLogin()).resolves.toEqual({ merged: 0, failed: 1 });
    expect(guestCart.list()).toEqual([]);
  });
});
