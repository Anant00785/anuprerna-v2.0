/**
 * apps/api/src/commerce/domain/custom-order-migrated.controller.spec.ts
 *
 * IDOR regression for the two customer-facing custom-order fulfillment reads.
 * Both were CODE_CU and filtered ONLY on the path :orderId, so any logged-in
 * customer could walk sequential ids and read every other customer's shipment
 * codes, tracking URLs and delivery dates.
 *
 * Loom scopes the customer variant by the token
 * (CustomOrderFulfillmentController.getCustomerCustomOrderFulfillmentList ->
 * retrieveCustomOrderFulfillmentListByTenant); the cross-tenant read lives on
 * the separate /get/super-user/... route.
 */
import { describe, it, expect, vi } from "vitest";
import { CustomOrderMigratedDomainController } from "./custom-order-migrated.controller.js";
import type { OrderDomainService } from "./order-domain.service.js";
import type { Database } from "../../database/database.module.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";

const TENANT_A = { id: 7, uid: "u7", email: "a@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;
const TENANT_B = { id: 8, uid: "u8", email: "b@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;

/** Custom order 500 belongs to tenant 7 only. */
const ROWS = [{ id: 1, customOrderId: 500, trackingUrl: "https://carrier/AWB-A" }];

function make() {
  const orders = {
    getCustomOrderFulfillmentsForTenant: vi.fn(async (orderId: number, tenantId: number) =>
      orderId === 500 && tenantId === 7 ? ROWS : [],
    ),
  };
  return {
    orders,
    controller: new CustomOrderMigratedDomainController({} as Database, orders as unknown as OrderDomainService),
  };
}

describe.each([
  ["get_get_customer_custom_order_orderId_fulfill", "/get/customer/custom-order/:orderId/fulfill"],
  ["get_get_customer_custom_order_orderId_fulfillment_list", "/get/customer/custom-order/:orderId/fulfillment-list"],
] as const)("GET %s", (handler, route) => {
  it(`${route} returns the owner's fulfillments keyed \`fulfillmentList\``, async () => {
    const { controller, orders } = make();

    await expect(controller[handler]("500", TENANT_A)).resolves.toEqual({
      success: true,
      message: "",
      fulfillmentList: ROWS,
    });
    expect(orders.getCustomOrderFulfillmentsForTenant).toHaveBeenCalledWith(500, 7);
  });

  it(`${route} — IDOR: tenant B cannot read tenant A's custom order 500`, async () => {
    const { controller, orders } = make();

    await expect(controller[handler]("500", TENANT_B)).resolves.toEqual({
      success: true,
      message: "",
      fulfillmentList: [],
    });
    // The scope handed down is the CALLER's tenant, never anything from the path.
    expect(orders.getCustomOrderFulfillmentsForTenant).toHaveBeenCalledWith(500, 8);
    expect(orders.getCustomOrderFulfillmentsForTenant).not.toHaveBeenCalledWith(500, 7);
  });
});
