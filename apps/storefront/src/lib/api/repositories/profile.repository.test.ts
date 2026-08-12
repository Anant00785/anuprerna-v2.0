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
  it("unwraps the legacy {success,message,addressList} envelope into an Address[]", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/address-list`, () =>
        HttpResponse.json(envelope("addressList", [{ id: 1, city: "Kolkata" }]))
      )
    );
    const result = await profileRepository.getAddressList("tok");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([{ id: 1, city: "Kolkata" }]);
  });

  it("returns an empty array for an empty envelope", async () => {
    useHandlers(http.get(`${PROXY_BASE}/get/address-list`, () => HttpResponse.json(envelope("addressList", []))));
    const result = await profileRepository.getAddressList("tok");
    expect(result).toEqual([]);
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
  it("unwraps the legacy {success,message,orderList} envelope into an Order[]", async () => {
    useHandlers(
      http.get(`${PROXY_BASE}/get/customer/order-list/all`, () =>
        HttpResponse.json(envelope("orderList", [{ id: 1, orderNumber: "ORD-1" }]))
      )
    );
    const orders = await profileRepository.getOrderList("tok");
    expect(Array.isArray(orders)).toBe(true);
    expect(orders).toEqual([{ id: 1, orderNumber: "ORD-1" }]);
  });
});
