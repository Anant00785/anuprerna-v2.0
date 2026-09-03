/**
 * apps/api/src/commerce/domain/customer.controller.spec.ts
 *
 * GET /get/customer/loyalty/info was CODE_CU and returned
 * `SELECT * FROM customer LIMIT 50` — 50 OTHER customers' rows to any
 * authenticated customer. Loom resolves the customer from the token and
 * returns one membership row under ResponseParameter.LOYALTY_PROGRAM_INFO.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { CustomerDomainController } from "./customer.controller.js";
import type { CustomerDomainService } from "./customer-domain.service.js";
import type { Database } from "../../database/database.module.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";

const TENANT_A = { id: 7, uid: "u7", email: "a@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;
const TENANT_B = { id: 8, uid: "u8", email: "b@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;

const membership = (tenantId: number) => ({
  tenantId,
  active: true,
  programEnrollmentDateEpochMS: 1000,
  currentCycleStartDateEpochMS: 1000,
  currentCycleEndDateEpochMS: 2000,
  tenureMonths: 12,
  minimumOrderValueCurrency: "INR",
  minimumOrderValue: 5000,
  minimumOrderValueINR: 5000,
  exchangeRate: 1,
  percentileDiscount: 10,
});

function make() {
  // Keyed by tenant id: the ONLY way to reach a row is to be that tenant.
  const rows: Record<number, ReturnType<typeof membership>> = { 7: membership(7), 8: membership(8) };
  const customers = {
    getLoyaltyMembershipInfo: vi.fn(async (tenantId: number) => rows[tenantId] ?? null),
  };
  return {
    customers,
    controller: new CustomerDomainController({} as Database, customers as unknown as CustomerDomainService),
  };
}

describe("GET /get/customer/loyalty/info", () => {
  it("returns ONE row for the calling tenant, keyed `loyaltyProgramInfo`", async () => {
    const { controller, customers } = make();

    const res = await controller.get_get_customer_loyalty_info(TENANT_A);

    expect(res).toEqual({ success: true, message: "", loyaltyProgramInfo: membership(7) });
    expect(customers.getLoyaltyMembershipInfo).toHaveBeenCalledWith(7);
  });

  it("IDOR: tenant B can never see tenant A's row — the id comes from the token only", async () => {
    const { controller, customers } = make();

    const res = await controller.get_get_customer_loyalty_info(TENANT_B);

    expect((res as { loyaltyProgramInfo: { tenantId: number } }).loyaltyProgramInfo.tenantId).toBe(8);
    expect(customers.getLoyaltyMembershipInfo).toHaveBeenCalledWith(8);
    expect(customers.getLoyaltyMembershipInfo).not.toHaveBeenCalledWith(7);
    // The handler takes no client-controlled parameter at all.
    expect(controller.get_get_customer_loyalty_info.length).toBe(1);
  });

  it("a tenant with no membership gets null, not somebody else's row", async () => {
    const { controller } = make();
    const stranger = { id: 99, uid: "u99", email: "c@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;
    await expect(controller.get_get_customer_loyalty_info(stranger)).resolves.toEqual({
      success: true,
      message: "",
      loyaltyProgramInfo: null,
    });
  });
});

describe("GET /get/table-explorer/data/customer", () => {
  // Loom CustomerController.getCustomerData: CODE_SU, required int page/size,
  // CustomerData projection keyed `customerList`.
  const customerRow = {
    id: 42n,
    version: 3n,
    tenantId: 9365,
    wishlist: "",
    defaultCurrency: "INR",
    whatsappNumber: "+911111111111",
    whatsappOptInStatus: "OPTED_IN",
    whatsappConsentExpiresAt: null,
    whatsappPromptAt: null,
    whatsappDismissCount: 0,
    whatsappPreferences: { marketing: true },
  };

  function makeWithDb(rows: unknown[]) {
    const offset = vi.fn(async () => rows);
    const limit = vi.fn(() => ({ offset }));
    const orderBy = vi.fn(() => ({ limit }));
    const from = vi.fn(() => ({ orderBy }));
    const select = vi.fn(() => ({ from }));
    const db = { select } as unknown as Database;
    const controller = new CustomerDomainController(db, {} as CustomerDomainService);
    return { controller, limit, offset };
  }

  it("returns the paginated projection keyed `customerList`, preferences serialized as text", async () => {
    const { controller, limit, offset } = makeWithDb([customerRow]);

    const res = await controller.get_get_table_explorer_data_customer("2", "25");

    expect(limit).toHaveBeenCalledWith(25);
    expect(offset).toHaveBeenCalledWith(50); // page * size, Loom's OFFSET arithmetic
    expect(res).toEqual({
      success: true,
      message: "",
      customerList: [{ ...customerRow, whatsappPreferences: JSON.stringify({ marketing: true }) }],
    });
  });

  it("an empty table reads as an empty list, not fabricated rows", async () => {
    const { controller } = makeWithDb([]);
    await expect(controller.get_get_table_explorer_data_customer("0", "10")).resolves.toEqual({
      success: true,
      message: "",
      customerList: [],
    });
  });

  it("missing or non-integer page/size is a 400, as Loom's required @RequestParam int", async () => {
    const { controller } = makeWithDb([]);
    await expect(controller.get_get_table_explorer_data_customer(undefined, "10")).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.get_get_table_explorer_data_customer("1", "abc")).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.get_get_table_explorer_data_customer("-1", "10")).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.get_get_table_explorer_data_customer("0", "0")).rejects.toBeInstanceOf(BadRequestException);
  });
});
