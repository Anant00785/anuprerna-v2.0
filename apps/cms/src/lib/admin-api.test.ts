import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { getCustomers, getSettings } from "./admin-api";

describe("admin-api", () => {
  it("returns normalized rows on a valid envelope", async () => {
    useHandlers(
      http.get("*/get/customers", () =>
        HttpResponse.json(
          envelope("customerList", [{ customerId: 5, userName: "Asha", email: "a@b.c" }]),
        ),
      ),
    );

    const [row] = await getCustomers("tok");

    expect(row).toMatchObject({ customerId: 5, userName: "Asha", email: "a@b.c" });
  });

  it("rejects with the backend's message on {success:false} at HTTP 200", async () => {
    useHandlers(http.get("*/get/customers", () => HttpResponse.json(errorEnvelope("customers denied"))));

    await expect(getCustomers("tok")).rejects.toThrow("customers denied");
  });

  it("rejects on a 500", async () => {
    useHandlers(http.get("*/get/customers", () => new HttpResponse(null, { status: 500 })));

    await expect(getCustomers("tok")).rejects.toThrow(/500/);
  });

  it("getSettings rejects rather than reporting 'no settings configured'", async () => {
    useHandlers(http.get("*/get/settings-list", () => HttpResponse.json(errorEnvelope("settings locked"))));

    await expect(getSettings("tok")).rejects.toThrow("settings locked");
  });
});
