import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { UserService } from "./user-service";

describe("UserService", () => {
  it("getCustomers hits '/get/customers' and unwraps 'customerList'", async () => {
    useHandlers(
      http.get("*/get/customers", () => HttpResponse.json(envelope("customerList", [{ uid: "u1", name: "Asha" }])))
    );
    const result = await UserService.getCustomers();
    expect(result).toEqual([{ uid: "u1", name: "Asha" }]);
  });

  it("getUserByUID hits the path-param URL and unwraps the 'tenant' key", async () => {
    useHandlers(
      http.get("*/get/tenant/profile/uid-123", () => HttpResponse.json(envelope("tenant", { uid: "uid-123", name: "Rahul" })))
    );
    const result = await UserService.getUserByUID("uid-123");
    expect(result).toEqual({ uid: "uid-123", name: "Rahul" });
  });

  it("propagates a rejected response from getCartOverviewList", async () => {
    useHandlers(
      http.get("*/get/tenant/cart-item/list", () => HttpResponse.json(errorEnvelope("cart overview unavailable")))
    );
    await expect(UserService.getCartOverviewList()).rejects.toThrow("cart overview unavailable");
  });

  it("registerCustomer POSTs the given payload verbatim to 'customer/registration/email'", async () => {
    let sawBody: unknown;
    useHandlers(
      http.post("*/customer/registration/email", async ({ request }) => {
        sawBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );
    const payload = { email: "a@b.com", password: "secret", firstName: "A" };
    await UserService.registerCustomer(payload);
    expect(sawBody).toEqual(payload);
  });
});
