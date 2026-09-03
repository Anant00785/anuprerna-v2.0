/**
 * apps/api/src/commerce/tenant/controller/customer-account.controller.spec.ts
 *
 * The five storefront-invented customer endpoints. Two things are pinned here:
 * the gate on every route (real RolesGuard, real metadata), and the rule that
 * nothing is ever taken from the request body that identifies the tenant — the
 * caller's own @CurrentTenant record is the only id that reaches the service.
 */
import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { BadRequestException, NotImplementedException } from "@nestjs/common";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CustomerAccountController } from "./customer-account.controller.js";
import type { TenantService } from "../service/tenant.service.js";

describeGates(
  "CustomerAccountController",
  CustomerAccountController as never,
  [
    ["declareBuyerType", GateCode.CODE_CU],
    ["getBuyerTypePrompt", GateCode.CODE_CU],
    ["recordBuyerTypePrompt", GateCode.CODE_CU],
    ["saveSignupDetails", GateCode.CODE_CU],
    ["updateSelectedForex", GateCode.CODE_CU],
  ],
  [],
);

function build() {
  const service = {
    updateCustomerProfile: vi.fn().mockResolvedValue({ id: 42 }),
    setSelectedCurrency: vi.fn().mockResolvedValue("USD"),
  };
  return { service, controller: new CustomerAccountController(service as unknown as TenantService) };
}

const ME = { tenantId: 42, id: 42 };

describe("POST /customer/buyer-type", () => {
  it("rejects a choice outside myself|business|skip", async () => {
    const { controller } = build();
    await expect(controller.declareBuyerType(ME, { choice: "wholesale" })).rejects.toThrow(BadRequestException);
  });

  it("does NOT report success for a declaration it cannot store", async () => {
    const { controller } = build();
    // A self-declaration must never be answered with `success: true` while
    // there is no column to hold it, and must never grant a wholesale role.
    await expect(controller.declareBuyerType(ME, { choice: "business" })).rejects.toThrow(NotImplementedException);
  });
});

describe("GET /customer/buyer-type/prompt", () => {
  it("answers with the keys the order dashboard reads, and offers nothing", async () => {
    const { controller } = build();
    const res = await controller.getBuyerTypePrompt(ME);
    expect(res).toMatchObject({ success: true, shouldPrompt: false, reason: null });
  });
});

describe("POST /customer/buyer-type/prompt", () => {
  it("rejects an unknown action", async () => {
    const { controller } = build();
    await expect(controller.recordBuyerTypePrompt(ME, { action: "accepted" })).rejects.toThrow(BadRequestException);
  });

  it("does not pretend a dismissal was recorded", async () => {
    const { controller } = build();
    await expect(controller.recordBuyerTypePrompt(ME, { action: "dismissed" })).rejects.toThrow(
      NotImplementedException,
    );
  });
});

describe("POST /customer/signup-details", () => {
  it("saves a name against the caller's own tenant, ignoring any id in the body", async () => {
    const { service, controller } = build();
    await controller.saveSignupDetails(ME, { name: "  Anant   Kumar ", tenantId: 999, id: 999 });
    expect(service.updateCustomerProfile).toHaveBeenCalledWith(42, { name: "Anant Kumar" });
  });

  it("succeeds with nothing written when the buyer typed nothing", async () => {
    const { service, controller } = build();
    const res = await controller.saveSignupDetails(ME, {});
    expect(res.success).toBe(true);
    expect(service.updateCustomerProfile).not.toHaveBeenCalled();
  });

  it("saves the name but reports the business details it cannot store", async () => {
    const { service, controller } = build();
    const call = controller.saveSignupDetails(ME, { name: "Anant", choice: "business", sourcing: "fabric" });
    await expect(call).rejects.toThrow(/name was saved.*buyer type and sourcing preference/is);
    expect(service.updateCustomerProfile).toHaveBeenCalledWith(42, { name: "Anant" });
  });

  it("rejects an unrecognised sourcing value", async () => {
    const { controller } = build();
    await expect(controller.saveSignupDetails(ME, { sourcing: "yarn" })).rejects.toThrow(BadRequestException);
  });
});

describe("POST /customer/update/selected-forex", () => {
  it("stores the currency upper-cased against the caller's own tenant", async () => {
    const { service, controller } = build();
    const res = await controller.updateSelectedForex(ME, { currency: "usd", tenantId: 999 });
    expect(service.setSelectedCurrency).toHaveBeenCalledWith(42, "USD");
    expect(res).toEqual({ success: true, message: "Currency preference saved." });
  });

  it("rejects a currency the storefront does not support", async () => {
    const { service, controller } = build();
    await expect(controller.updateSelectedForex(ME, { currency: "btc" })).rejects.toThrow(BadRequestException);
    expect(service.setSelectedCurrency).not.toHaveBeenCalled();
  });
});
