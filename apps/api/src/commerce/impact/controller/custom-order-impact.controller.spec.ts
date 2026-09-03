/**
 * GET /get/impact/custom-order/:customOrderId and .../aggregation — ported from
 * Loom ImpactFactorController.getCustomOrderImpact /
 * getCustomOrderImpactAggregation.
 *
 * The tenant-scoping assertions are the important ones: Loom passes
 * `superUser ? null : tenant`, so a customer must never be able to read another
 * tenant's custom order impact.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { ImpactController } from "./impact.controller.js";
import type { ImpactService } from "../service/impact.service.js";
import type { CustomOrderImpactService } from "../service/custom-order-impact.service.js";
import { emptyCalculationResult } from "../dto/impact-calculation.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { emptyImpactSummary } from "../dto/impact-summary.js";

const tenantWith = (roles: string[], id = 77) =>
  ({ id, uid: `u${id}`, email: "a@b.com", roles }) as unknown as AuthenticatedTenant;

function make(over: Partial<Record<string, unknown>> = {}) {
  const service = {
    getCustomOrderImpact: vi.fn().mockResolvedValue(emptyImpactSummary(5)),
    getCustomImpactAggregation: vi.fn().mockResolvedValue({ totalOrders: 0 }),
    ...over,
  };
  const trigger = {
    calculateCustomOrderImpact: vi.fn().mockResolvedValue(emptyCalculationResult(5)),
    ...over,
  };
  return {
    service,
    trigger,
    controller: new ImpactController(
      service as unknown as ImpactService,
      trigger as unknown as CustomOrderImpactService,
    ),
  };
}

describe("GET /get/impact/custom-order/:customOrderId", () => {
  it("returns the summary under Loom's `impact` key", async () => {
    const summary = { ...emptyImpactSummary(5), fabricMeters: 12.5, completeItems: 2 };
    const { controller } = make({ getCustomOrderImpact: vi.fn().mockResolvedValue(summary) });

    await expect(controller.getCustomOrderImpact("5", tenantWith(["ROLE_SUPER_USER"]))).resolves.toEqual({
      success: true,
      message: "",
      impact: summary,
    });
  });

  it("gives a SUPER_USER an unscoped read (null tenant scope), as Loom does", async () => {
    const { controller, service } = make();
    await controller.getCustomOrderImpact("5", tenantWith(["ROLE_SUPER_USER"]));
    expect(service.getCustomOrderImpact).toHaveBeenCalledWith(5, null);
  });

  it("gives GOD_MODE the same unscoped read", async () => {
    const { controller, service } = make();
    await controller.getCustomOrderImpact("5", tenantWith(["ROLE_GOD_MODE"]));
    expect(service.getCustomOrderImpact).toHaveBeenCalledWith(5, null);
  });

  it("scopes a CUSTOMER to their OWN tenant id, never the path id", async () => {
    const { controller, service } = make();
    await controller.getCustomOrderImpact("5", tenantWith(["ROLE_CUSTOMER"], 42));
    expect(service.getCustomOrderImpact).toHaveBeenCalledWith(5, 42);
  });

  it("uses a scope that matches nothing when a non-SU caller has no resolvable tenant", async () => {
    const { controller, service } = make();
    await controller.getCustomOrderImpact("5", tenantWith(["ROLE_CUSTOMER"], 0));
    expect(service.getCustomOrderImpact).toHaveBeenCalledWith(5, -1);
    expect(service.getCustomOrderImpact).not.toHaveBeenCalledWith(5, null);
  });

  it("returns a zeroed summary (Loom's emptyOrder) for an order with no impact rows", async () => {
    const { controller } = make({ getCustomOrderImpact: vi.fn().mockResolvedValue(emptyImpactSummary(9)) });
    const res = await controller.getCustomOrderImpact("9", tenantWith(["ROLE_SUPER_USER"]));
    expect(res.impact).toMatchObject({ orderId: 9, completeItems: 0, partialItems: 0, items: [] });
  });

  it("rejects a non-numeric id instead of querying with NaN", async () => {
    const { controller, service } = make();
    await expect(controller.getCustomOrderImpact("abc", tenantWith(["ROLE_SUPER_USER"]))).rejects.toThrow(
      BadRequestException,
    );
    expect(service.getCustomOrderImpact).not.toHaveBeenCalled();
  });
});

describe("GET /get/impact/custom-order/aggregation", () => {
  it("returns totals under Loom's `impactAggregation` key", async () => {
    const agg = { totalOrders: 3, totalItems: 7, fabricMeters: 20 };
    const { controller } = make({ getCustomImpactAggregation: vi.fn().mockResolvedValue(agg) });

    await expect(controller.getCustomOrderImpactAggregation()).resolves.toEqual({
      success: true,
      message: "",
      impactAggregation: agg,
    });
  });
});
