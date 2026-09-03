import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { cartRepository, CartAuthError } from "./cart.repository";
import { useHandlers } from "@/test/msw";

// The cart goes through the SAME server-side `/api/cart/*` BFF routes checkout
// uses: Loom-backed, authenticated from the httpOnly `loom_jwt` cookie. It used
// to call `/api/backend/*`, which proxies to a DIFFERENT backend and
// authenticated off a cookie no mounted login form ever wrote — so every call
// 401'd and `getCart` turned that into an empty cart. These tests pin the
// contract that replaced it: errors surface, they are never masked as "empty".

const BFF = "http://localhost:3000/api";

const cartRow = {
  id: 166340327,
  quantity: 2,
  unit: "METER",
  orderType: "IN_STOCK",
  productGroup: "fabric",
  makingCharge: 0,
  selectedFinishId: "",
  fabricProductPreview: {
    id: 163523574,
    product: {
      id: 163523575,
      name: "Handwoven Fabric",
      slug: "handwoven",
      sku: "DSG1210474",
      price: 446,
      unit: "METER",
    },
  },
};

describe("cartRepository.getCart", () => {
  it("reads the cart from the /api/cart BFF route, not the /api/backend proxy", async () => {
    let capturedUrl: string | undefined;
    useHandlers(
      http.get(`${BFF}/cart`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ authenticated: true, cartItemList: [cartRow] });
      })
    );

    const cart = await cartRepository.getCart();

    expect(capturedUrl).toContain("/api/cart");
    expect(capturedUrl).not.toContain("/api/backend");
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].id).toBe("166340327");
    expect(cart.itemCount).toBe(2);
  });

  it("treats a signed-out session as a genuinely empty cart, not an error", async () => {
    useHandlers(
      http.get(`${BFF}/cart`, () => HttpResponse.json({ authenticated: false, entity: [] }))
    );

    const cart = await cartRepository.getCart();

    expect(cart.items).toEqual([]);
    expect(cart.itemCount).toBe(0);
  });

  it("THROWS on a backend failure instead of reporting an empty cart", async () => {
    // The old behaviour returned an empty cart here, which is why a buyer with
    // items in Loom was told "your cart is empty".
    useHandlers(
      http.get(`${BFF}/cart`, () =>
        HttpResponse.json({ success: false, cartItemList: [] }, { status: 502 })
      )
    );

    await expect(cartRepository.getCart()).rejects.toThrow();
  });

  it("raises CartAuthError on a 401 so the UI can offer sign-in", async () => {
    useHandlers(
      http.get(`${BFF}/cart`, () =>
        HttpResponse.json({ success: false, message: "Not authenticated." }, { status: 401 })
      )
    );

    await expect(cartRepository.getCart()).rejects.toBeInstanceOf(CartAuthError);
  });

  it("raises CartAuthError when the BFF flags an expired session with reauth", async () => {
    useHandlers(
      http.get(`${BFF}/cart`, () =>
        HttpResponse.json({ success: false, reauth: true, message: "expired" }, { status: 401 })
      )
    );

    await expect(cartRepository.getCart()).rejects.toBeInstanceOf(CartAuthError);
  });
});

describe("cartRepository.addToCart", () => {
  it("POSTs the flat Loom CartItem entity to /api/cart/add", async () => {
    let body: any;
    useHandlers(
      http.post(`${BFF}/cart/add`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    await cartRepository.addToCart({
      fabricProductId: 163523574,
      quantity: 3,
      unit: "METER",
      price: 446,
      sku: "DSG1210474",
    });

    expect(body).toMatchObject({
      fabricProductId: 163523574,
      quantity: 3,
      unit: "METER",
      price: 446,
      sku: "DSG1210474",
      orderType: "IN_STOCK",
      productGroup: "fabric",
    });
  });

  it("omits zero/absent foreign keys rather than sending 0, which Loom cannot join", async () => {
    let body: any;
    useHandlers(
      http.post(`${BFF}/cart/add`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    await cartRepository.addToCart({
      fabricProductId: 0,
      finishedProductId: undefined,
      selectedFabricId: 0,
      quantity: 1,
      unit: "METER",
      price: 100,
      sku: "X",
    });

    expect(body).not.toHaveProperty("fabricProductId");
    expect(body).not.toHaveProperty("finishedProductId");
    expect(body).not.toHaveProperty("selectedFabricId");
    // NOT NULL columns are still always present.
    expect(body).toHaveProperty("selectedFinishId", "");
    expect(body).toHaveProperty("customSize");
    expect(body).toHaveProperty("makingCharge", 0);
  });

  it("throws on Loom's 200 + {success:false} rejection instead of reporting a silent success", async () => {
    useHandlers(
      http.post(`${BFF}/cart/add`, () =>
        HttpResponse.json({ success: false, message: "Out of stock" })
      )
    );

    await expect(
      cartRepository.addToCart({ quantity: 1, unit: "METER", price: 1, sku: "X" })
    ).rejects.toThrow("Out of stock");
  });

  it("raises CartAuthError when the session has expired", async () => {
    useHandlers(
      http.post(`${BFF}/cart/add`, () =>
        HttpResponse.json({ success: false, reauth: true }, { status: 401 })
      )
    );

    await expect(
      cartRepository.addToCart({ quantity: 1, unit: "METER", price: 1, sku: "X" })
    ).rejects.toBeInstanceOf(CartAuthError);
  });
});

describe("cartRepository.updateQuantity", () => {
  it("sends the quantity and the product FK — never a price", async () => {
    // Re-serialising the row here is what silently dropped volume discounts and
    // wiped fabric/size/customSize selections on every quantity change.
    let body: any;
    useHandlers(
      http.patch(`${BFF}/cart/update`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    await cartRepository.updateQuantity(
      {
        id: "166340327",
        productId: "163523574",
        product: { id: "1", slug: "s", name: "n", sku: "K", price: 446, currency: "INR", thumbnail: "", gallery: [], inStock: true },
        quantity: 2,
        unitPrice: 446,
        discountedUnitPrice: 400,
        totalPrice: 800,
        source: cartRow,
      },
      25
    );

    expect(body).toMatchObject({ id: 166340327, quantity: 25 });
    // The product FK travels because the backend's write validator requires it
    // and its read does not always hydrate the preview to recover it from.
    expect(body.fabricProductId).toBe(163523574);
    // NO price, and no customisation, is echoed from the client. That is what
    // re-priced bulk lines upward and wiped fabric/size/customSize selections;
    // the BFF re-reads the stored row for all of it.
    expect(body).not.toHaveProperty("price");
    expect(body).not.toHaveProperty("makingCharge");
    expect(body).not.toHaveProperty("customSize");
    expect(body).not.toHaveProperty("selectedFabricId");
  });

  it("throws on Loom's 200 + {success:false} rejection", async () => {
    useHandlers(
      http.patch(`${BFF}/cart/update`, () =>
        HttpResponse.json({ success: false, message: "Minimum order quantity is 25" })
      )
    );

    await expect(
      cartRepository.updateQuantity(
        {
          id: "1",
          productId: "1",
          product: { id: "1", slug: "s", name: "n", sku: "K", price: 1, currency: "INR", thumbnail: "", gallery: [], inStock: true },
          quantity: 1,
          unitPrice: 1,
          totalPrice: 1,
        },
        2
      )
    ).rejects.toThrow("Minimum order quantity is 25");
  });
});

describe("cartRepository.removeCartItem", () => {
  it("POSTs the cart row id to /api/cart/remove", async () => {
    let body: any;
    useHandlers(
      http.post(`${BFF}/cart/remove`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    await cartRepository.removeCartItem("166340327");

    expect(body).toEqual({ id: 166340327 });
  });

  it("throws on Loom's 200 + {success:false} rejection so the row can report it", async () => {
    // A delete that failed used to only console.error, which is why the button
    // looked dead.
    useHandlers(
      http.post(`${BFF}/cart/remove`, () =>
        HttpResponse.json({ success: false, message: "Could not remove the cart item." })
      )
    );

    await expect(cartRepository.removeCartItem("1")).rejects.toThrow(
      "Could not remove the cart item."
    );
  });

  it("raises CartAuthError on an expired session", async () => {
    useHandlers(
      http.post(`${BFF}/cart/remove`, () =>
        HttpResponse.json({ success: false, reauth: true }, { status: 401 })
      )
    );

    await expect(cartRepository.removeCartItem("1")).rejects.toBeInstanceOf(CartAuthError);
  });
});
