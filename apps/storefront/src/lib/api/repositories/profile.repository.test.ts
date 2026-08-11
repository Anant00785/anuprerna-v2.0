import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { profileRepository } from "./profile.repository";
import { useHandlers, PROXY_BASE, envelope } from "@/test/msw";

describe("profileRepository.getCustomerProfile", () => {
  it("attaches an explicit Authorization header when a JWT is passed in", async () => {
    let auth: string | null = null;
    useHandlers(
      http.get(`${PROXY_BASE}/get/customer/profile`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ id: 1, firstName: "A" });
      })
    );
    const profile = await profileRepository.getCustomerProfile("tok123");
    expect(auth).toBe("Bearer tok123");
    expect(profile.firstName).toBe("A");
  });

  it("sends no Authorization header when no JWT is supplied", async () => {
    let auth: string | null = "unset";
    useHandlers(
      http.get(`${PROXY_BASE}/get/customer/profile`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ id: 1 });
      })
    );
    await profileRepository.getCustomerProfile();
    expect(auth).toBeNull();
  });

  it("throws on a 401 rather than swallowing it (no try/catch in this repository)", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/customer/profile`, () =>
        HttpResponse.json({ success: false, message: "unauthorized" }, { status: 401 })
      )
    );
    await expect(profileRepository.getCustomerProfile("bad-token")).rejects.toThrow(/API Error \[401\]/);
  });
});

describe("profileRepository.getAddressList", () => {
  it("BUG: does not unwrap the legacy envelope — returns the raw {success,message,addressList} object, not an Address[]", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/address-list`, () =>
        HttpResponse.json(envelope("addressList", [{ id: 1, city: "Kolkata" }]))
      )
    );
    const result = await profileRepository.getAddressList("tok");
    // Typed as Promise<Address[]>, but apiRequest only casts — it never
    // unwraps `payload`/`addressList` the way catalog/cart repositories do.
    // Any caller doing `addresses.map(...)` on this in production would
    // throw, since result is not actually an array.
    expect(Array.isArray(result)).toBe(false);
    expect((result as unknown as { addressList: unknown[] }).addressList).toEqual([{ id: 1, city: "Kolkata" }]);
  });

  it("returns an empty envelope's addressList untouched for an empty list", async () => {
    useHandlers(http.get(`${PROXY_BASE}/get/address-list`, () => HttpResponse.json(envelope("addressList", []))));
    const result = await profileRepository.getAddressList("tok");
    expect((result as unknown as { addressList: unknown[] }).addressList).toEqual([]);
  });
});

describe("profileRepository.addAddress", () => {
  it("POSTs the address body to add/address and returns the response", async () => {
    let capturedBody: unknown;
    const address = { name: "A", city: "Kolkata", pincode: "700001" };
    useHandlers(
      http.post(`${PROXY_BASE}/add/address`, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ ...address, id: 1 });
      })
    );
    const res = await profileRepository.addAddress(address, "tok");
    expect(capturedBody).toEqual(address);
    expect(res.id).toBe(1);
  });
});

describe("profileRepository.deleteAddress", () => {
  it("issues a DELETE to delete/address/:id", async () => {
    let method: string | undefined;
    useHandlers(
      http.delete(`${PROXY_BASE}/delete/address/7`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ success: true });
      })
    );
    const res = await profileRepository.deleteAddress(7, "tok");
    expect(method).toBe("DELETE");
    expect(res.success).toBe(true);
  });
});

describe("profileRepository.getOrderList", () => {
  it("same unwrap gap as getAddressList: the real envelope response is returned whole, not as Order[]", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/customer/order-list/all`, () =>
        HttpResponse.json(envelope("orderList", [{ id: 1, orderNumber: "ORD-1" }]))
      )
    );
    const orders = await profileRepository.getOrderList("tok");
    expect(Array.isArray(orders)).toBe(false);
    expect((orders as unknown as { orderList: unknown[] }).orderList).toEqual([{ id: 1, orderNumber: "ORD-1" }]);
  });
});
