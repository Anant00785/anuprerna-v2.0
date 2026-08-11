import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { LoyaltyService, LoyaltyProgramValidationService, LoyaltyConfigAuditLogTypeEnum } from "./loyalty-service";

describe("LoyaltyService.getLoyaltyProgramEligibleCustomers", () => {
  it("builds an email-only query when email is provided", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get("*/get/loyalty-eligible/customers", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(envelope("customerList", []));
      })
    );

    await LoyaltyService.getLoyaltyProgramEligibleCustomers({
      email: "a@b.com",
      tenureMonths: 6,
      minimumRequiredValueRs: 1000,
    });

    // email takes priority over tenure/amount per the service's if/else-if.
    expect(capturedUrl?.searchParams.get("email")).toBe("a@b.com");
    expect(capturedUrl?.searchParams.has("tenure")).toBe(false);
  });

  it("builds a tenure+amount query when email is absent", async () => {
    let capturedUrl: URL | undefined;
    useHandlers(
      http.get("*/get/loyalty-eligible/customers", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(envelope("customerList", []));
      })
    );

    await LoyaltyService.getLoyaltyProgramEligibleCustomers({
      email: "",
      tenureMonths: 12,
      minimumRequiredValueRs: 5000,
    });

    expect(capturedUrl?.searchParams.get("tenure")).toBe("12");
    expect(capturedUrl?.searchParams.get("minimumTotalAmount")).toBe("5000");
  });
});

describe("LoyaltyService.getLoyaltyProgramCustomerMetrics", () => {
  it("sends the active flag and unwraps customerList", async () => {
    let capturedUrl: URL | undefined;
    const fixture = [{ tenantId: 1, customerId: 2, userName: "Ravi", email: "r@x.com" }];
    useHandlers(
      http.get("*/get/loyalty-program/customers/metrics", ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json(envelope("customerList", fixture));
      })
    );

    const result = await LoyaltyService.getLoyaltyProgramCustomerMetrics(true);

    expect(capturedUrl?.searchParams.get("active")).toBe("true");
    expect(result).toEqual(fixture);
  });

  it("has no try/catch: a success:false envelope propagates as a thrown error", async () => {
    useHandlers(http.get("*/get/loyalty-program/customers/metrics", () => HttpResponse.json(errorEnvelope("denied"))));

    await expect(LoyaltyService.getLoyaltyProgramCustomerMetrics(false)).rejects.toThrow("denied");
  });
});

describe("LoyaltyService.enableLoyaltyProgramCustomers", () => {
  it("posts the config payload as-is to /enable/loyalty-program", async () => {
    let capturedBody: unknown;
    useHandlers(
      http.post("*/enable/loyalty-program", async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const payload = {
      id: 1,
      customerId: 5,
      tenure: 12,
      discountPercentage: 10,
      minimumOrderValueCurrency: "INR",
      minimumOrderValue: 1000,
      minimumOrderValueINR: 1000,
      exchangeRate: 1,
      type: LoyaltyConfigAuditLogTypeEnum.ONBOARDING,
    };

    await LoyaltyService.enableLoyaltyProgramCustomers(payload);

    expect(capturedBody).toEqual(payload);
  });
});

describe("LoyaltyProgramValidationService.validate", () => {
  it("flags a discount over 100% (pure function, no network)", () => {
    const errors = LoyaltyProgramValidationService.validate({
      id: 1,
      customerId: 1,
      tenure: 6,
      discountPercentage: 150,
      minimumOrderValueCurrency: "INR",
      minimumOrderValue: 1000,
      minimumOrderValueINR: 1000,
      exchangeRate: 1,
      type: LoyaltyConfigAuditLogTypeEnum.ADJUSTMENT,
    });

    expect(errors.discountPercentage).toBe("Discount must not exceed 100%");
  });
});
