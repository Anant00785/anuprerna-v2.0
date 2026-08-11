import { describe, it, expect, vi } from "vitest";
import { OrderController } from "./order.controller.js";

// NOTE ON SCOPE: apps/api/src/commerce/order/order.module.ts wires up ONLY
// this file (order.controller.ts) and the sibling order.service.ts as the
// live OrderModule — confirmed by tracing every import: order.module.ts
// imports "./order.controller.js" / "./order.service.js" (these files, at
// the order/ root), not the richer files under order/controller/,
// order/service/, order/dto/, order/repository/, order/types/. None of
// those richer files (which contain addOrder/attribution-shaped code,
// CustomOrderController, OrderFulfillmentController, OrderFeedbackController)
// are imported by order.module.ts, commerce.module.ts, or anywhere else in
// the tree (verified with a repo-wide grep) — they are suspected dead code,
// not covered here per docs/TESTING.md §2 ("check importers before testing
// anything"). See the handoff report for the full list.
//
// This controller is a thin pass-through over CommerceDataService's generic
// get/create (see order.service.spec.ts); characterized, not deeply tested.
describe("OrderController (live, order.module.ts-wired)", () => {
  it("getAll() delegates directly to service.getAll()", async () => {
    const rows = [{ id: 1n }];
    const service = { getAll: vi.fn().mockResolvedValue(rows), create: vi.fn() };
    const controller = new OrderController(service as any);

    await expect(controller.getAll()).resolves.toBe(rows);
    expect(service.getAll).toHaveBeenCalledOnce();
  });

  it("create() delegates the raw body to service.create() untouched", async () => {
    const created = { id: 2n, name: "x" };
    const service = { getAll: vi.fn(), create: vi.fn().mockResolvedValue(created) };
    const controller = new OrderController(service as any);
    const body = { name: "x" };

    await expect(controller.create(body)).resolves.toBe(created);
    expect(service.create).toHaveBeenCalledWith(body);
  });

  it("does not catch or transform errors thrown by the service", async () => {
    const service = { getAll: vi.fn(), create: vi.fn().mockRejectedValue(new Error("boom")) };
    const controller = new OrderController(service as any);

    await expect(controller.create({})).rejects.toThrow("boom");
  });
});
