/**
 * Regression: these handlers used `tenant?.id || tenant?.tenantId || 1`, so a
 * request whose guard attached no tenant acted as CUSTOMER 1 — creating,
 * listing, and cancelling custom orders against another customer's account.
 * A missing tenant must never resolve to customer 1.
 */
import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { CustomOrderController } from "./custom-order.controller.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";

function make() {
  const svc = {
    createCustomOrder: vi.fn().mockResolvedValue({ id: 1n }),
    getCustomOrdersByTenant: vi.fn().mockResolvedValue([]),
    cancelCustomOrder: vi.fn().mockResolvedValue(true),
  };
  return { svc, ctrl: new CustomOrderController(svc as never) };
}

const missing = undefined as unknown as AuthenticatedTenant;

describe("CustomOrderController — no customer-1 fallback", () => {
  it("createCustomOrder without a tenant fails and never reaches the service", async () => {
    const { svc, ctrl } = make();
    const res = await ctrl.createCustomOrder(missing, { note: "x" } as never);
    expect(res.success).toBe(false);
    expect(svc.createCustomOrder).not.toHaveBeenCalled();
  });

  it("getCustomerCustomOrderList without a tenant never queries as customer 1", async () => {
    const { svc, ctrl } = make();
    await ctrl.getCustomerCustomOrderList(missing);
    expect(svc.getCustomOrdersByTenant).not.toHaveBeenCalled();
  });

  it("cancelCustomOrder without a tenant fails and never cancels as customer 1", async () => {
    const { svc, ctrl } = make();
    const res = await ctrl.cancelCustomOrder(missing, { orderId: 5 } as never);
    expect(res.success).toBe(false);
    expect(svc.cancelCustomOrder).not.toHaveBeenCalled();
  });

  it("a real tenant id is the one passed through", async () => {
    const { svc, ctrl } = make();
    const tenant: AuthenticatedTenant = { id: 42, uid: "U1", email: "c@x.in", roles: ["ROLE_CUSTOMER"] };
    await ctrl.createCustomOrder(tenant, { note: "x" } as never);
    expect(svc.createCustomOrder).toHaveBeenCalledWith(42, expect.anything());
  });
});
