/**
 * apps/api/src/commerce/domain/order-migrated.controller.spec.ts
 *
 * Covers the order-shaped routes that were fixed in the commerce/domain pass:
 *  - /get/impact/order/:orderId — was `SELECT * FROM product LIMIT 50`, ignoring
 *    :orderId entirely, and unscoped for a CODE_SUCU customer caller (IDOR).
 *  - /get/order/:orderId/workflow-list — same product dump, now the real
 *    workflow summaries keyed `workflowList`.
 *  - /trigger/impact/order/:orderId and /get/order/:orderId/workflow/:orderItemId
 *    — no Java original; must fail loudly, not answer 200 with wrong data.
 *
 * Envelope keys are asserted against Loom's ResponseParameter (IMPACT =
 * "impact", WORKFLOW_LIST = "workflowList"), not against what the code
 * happened to return before.
 */
import { describe, it, expect, vi } from "vitest";
import { NotImplementedException } from "@nestjs/common";
import { OrderMigratedDomainController } from "./order-migrated.controller.js";
import type { OrderDomainService } from "./order-domain.service.js";
import type { Database } from "../../database/database.module.js";
import { GatekeeperService } from "../../auth/service/gatekeeper.service.js";
import { GateCode, type AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { emptyImpactSummary } from "../impact/dto/impact-summary.js";

const CUSTOMER_A = { id: 7, uid: "u7", email: "a@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;
const CUSTOMER_B = { id: 8, uid: "u8", email: "b@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;
const SUPER_USER = { id: 1, uid: "u1", email: "s@b.com", roles: ["ROLE_SUPER_USER"] } as AuthenticatedTenant;

const fakeConfig = {
  get: (key: string) =>
    ({ AUTH_JWT_SECRET: "test-jwt-secret-not-real", AUTH_PASSWORD_PEPPER: "test-pepper", AUTH_JWT_TTL_SECONDS: 3600 })[
      key
    ],
} as unknown as ConstructorParameters<typeof GatekeeperService>[0];

/** The real gatekeeper — the superUser branch must be decided by the real gate. */
const gatekeeper = new GatekeeperService(fakeConfig);

function make(over: Partial<Record<keyof OrderDomainService, unknown>> = {}) {
  const orders = {
    getOrderImpact: vi.fn().mockResolvedValue(emptyImpactSummary(1)),
    getOrderWorkflowSummaries: vi.fn().mockResolvedValue([]),
    getCustomOrderFulfillmentsForTenant: vi.fn().mockResolvedValue([]),
    getOrderImpactAggregation: vi.fn().mockResolvedValue({ totalOrders: 3, totalItems: 9 }),
    ...over,
  };
  const controller = new OrderMigratedDomainController(
    {} as Database,
    orders as unknown as OrderDomainService,
    gatekeeper,
  );
  return { orders, controller };
}

describe("GET /get/impact/order/:orderId", () => {
  it("answers for the REQUESTED order id, keyed `impact`", async () => {
    const summary = { ...emptyImpactSummary(4242), co2OffsetKg: 12.5 };
    const { controller, orders } = make({ getOrderImpact: vi.fn().mockResolvedValue(summary) });

    const res = await controller.get_get_impact_order_orderId("4242", CUSTOMER_A);

    expect(res).toEqual({ success: true, message: "", impact: summary });
    expect((res as { impact: { orderId: number } }).impact.orderId).toBe(4242);
    expect(orders.getOrderImpact).toHaveBeenCalledWith(4242, 7);
  });

  it("IDOR: a customer is scoped to their OWN tenant id, never the path id", async () => {
    const { controller, orders } = make();

    await controller.get_get_impact_order_orderId("4242", CUSTOMER_B);

    // Tenant B asks for the same order; the scope handed to the service is
    // tenant B's own id, so tenant A's order cannot come back.
    expect(orders.getOrderImpact).toHaveBeenCalledWith(4242, 8);
    expect(orders.getOrderImpact).not.toHaveBeenCalledWith(4242, 7);
  });

  it("a super user reads across tenants — Loom's `superUser ? null : tenant`", async () => {
    const { controller, orders } = make();
    await controller.get_get_impact_order_orderId("4242", SUPER_USER);
    expect(orders.getOrderImpact).toHaveBeenCalledWith(4242, null);
    // and that branch is decided by the real gate, not a hand-rolled role check
    expect(gatekeeper.userHasAppropriateAuthority(SUPER_USER, GateCode.CODE_SU)).toBe(true);
    expect(gatekeeper.userHasAppropriateAuthority(CUSTOMER_A, GateCode.CODE_SU)).toBe(false);
  });
});

describe("GET /get/order/:orderId/workflow-list", () => {
  it("answers for the REQUESTED order id, keyed `workflowList`", async () => {
    const rows = [{ workflowId: 9, orderItemId: 3, workflowName: "Weave" }];
    const { controller, orders } = make({ getOrderWorkflowSummaries: vi.fn().mockResolvedValue(rows) });

    const res = await controller.get_get_order_orderId_workflow_list("55");

    expect(res).toEqual({ success: true, message: "", workflowList: rows });
    expect(orders.getOrderWorkflowSummaries).toHaveBeenCalledWith(55);
  });
});

describe("GET /get/impact/order/aggregation", () => {
  it("returns the real aggregation keyed `impactAggregation`, not a product dump", async () => {
    const { controller, orders } = make();
    await expect(controller.get_get_impact_order_aggregation()).resolves.toEqual({
      success: true,
      message: "",
      impactAggregation: { totalOrders: 3, totalItems: 9 },
    });
    expect(orders.getOrderImpactAggregation).toHaveBeenCalledOnce();
  });
});

describe("routes with no Java original fail loudly", () => {
  it("POST /trigger/impact/order/:orderId throws instead of returning a product dump", async () => {
    const { controller } = make();
    await expect(controller.post_trigger_impact_order_orderId("1", {})).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  it("GET /get/order/:orderId/workflow/:orderItemId throws (was CODE_CU and unscoped)", async () => {
    const { controller } = make();
    await expect(controller.get_get_order_orderId_workflow_orderItemId("1", "2")).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });
});
