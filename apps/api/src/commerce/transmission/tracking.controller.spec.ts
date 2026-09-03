import { describe, it, expect } from "vitest";
import { TrackingController, buildTrackingResponse, type TrackingRecord } from "./tracking.controller.js";
import type { TransmissionService } from "./transmission.service.js";
import type { TrackingOwnershipService } from "./tracking.service.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";

// NOTE ON REACHABILITY: TrackingController is declared in TransmissionModule,
// which reaches the app only transitively via WhatsappModule -> CommerceModule.
// Tests below characterize the code as written.
//
// The /track/* routes have NO Java original. They were CODE_SU and keyed off a
// sequential order id; they are now CODE_CU and every read is scoped to the
// caller's own orders (see tracking.service.ts). /track/all stays super-user.

function record(overrides: Partial<TrackingRecord["payload"]> = {}, createdAt = "2026-01-10T00:00:00.000Z"): TrackingRecord {
  return {
    id: "1",
    name: "batch-1",
    createdAt,
    updatedAt: createdAt,
    payload: {
      transmissionBatchNo: "TRM-1",
      carrierName: "BlueDart",
      trackingNumber: "AWB123",
      orderIds: [101, 102],
      destinationHub: "Mumbai Hub",
      status: "DISPATCHED",
      ...overrides,
    },
  };
}

describe("buildTrackingResponse (pure) — nothing is invented", () => {
  it("reports the record's own creation time as recordedAt, verbatim", () => {
    const r = buildTrackingResponse(record(), "orderId", 101);
    expect(r?.recordedAt).toBe("2026-01-10T00:00:00.000Z");
  });

  it("never invents a delivery estimate — estimatedDelivery is always null", () => {
    // Previously synthesized as createdAt + 7 days and shown to customers.
    // TransmissionPayload has no ETA field, so a missing estimate stays missing.
    expect(buildTrackingResponse(record(), "orderId", 101)?.estimatedDelivery).toBeNull();
    expect(buildTrackingResponse(record({ status: "DELIVERED" }), "orderId", 101)?.estimatedDelivery).toBeNull();
  });

  it("never invents timeline events — only the one status the record carries", () => {
    // The old ladder fabricated ORDER_PLACED (-1d), IN_TRANSIT (+1d) and
    // DELIVERED (+5d) from arithmetic on createdAt.
    const dispatched = buildTrackingResponse(record({ status: "DISPATCHED" }), "orderId", 101);
    expect(dispatched?.timeline).toEqual([{ status: "DISPATCHED", timestamp: "2026-01-10T00:00:00.000Z" }]);

    const delivered = buildTrackingResponse(record({ status: "DELIVERED" }), "orderId", 101);
    expect(delivered?.timeline).toEqual([{ status: "DELIVERED", timestamp: "2026-01-10T00:00:00.000Z" }]);
    expect(delivered?.timeline.map((t) => t.status)).not.toContain("IN_TRANSIT");
  });

  it("emits no timeline at all when the record carries no status", () => {
    const r = buildTrackingResponse(record({ status: undefined as unknown as string }), "orderId", 101);
    expect(r?.timeline).toEqual([]);
  });

  it("surfaces missing fields as null rather than substituting a plausible value", () => {
    const r = buildTrackingResponse(
      record({ carrierName: undefined as unknown as string, destinationHub: "   " }),
      "orderId",
      101,
    );
    expect(r?.carrier).toBeNull();
    expect(r?.destinationHub).toBeNull();
  });

  it("does not fall back to `now` when the record has no usable createdAt", () => {
    const r = buildTrackingResponse({ ...record(), createdAt: "" }, "orderId", 101);
    expect(r?.recordedAt).toBeNull();
    expect(r?.timeline).toEqual([{ status: "DISPATCHED", timestamp: null }]);
  });

  it("returns null when the record carries no tracking information at all", () => {
    const empty = {
      id: "1",
      name: "x",
      createdAt: "2026-01-10T00:00:00.000Z",
      updatedAt: "2026-01-10T00:00:00.000Z",
      payload: {} as TrackingRecord["payload"],
    };
    expect(buildTrackingResponse(empty, "orderId", 101)).toBeNull();
  });

  it("passes through searchedBy/searchValue and the stored payload fields verbatim", () => {
    const r = buildTrackingResponse(record(), "trackingNumber", "AWB123");
    expect(r?.searchedBy).toBe("trackingNumber");
    expect(r?.searchValue).toBe("AWB123");
    expect(r?.batchNo).toBe("TRM-1");
    expect(r?.carrier).toBe("BlueDart");
    expect(r?.trackingNumber).toBe("AWB123");
    expect(r?.orderIds).toEqual([101, 102]);
    expect(r?.currentStatus).toBe("DISPATCHED");
    expect(r?.destinationHub).toBe("Mumbai Hub");
  });
});

describe("TrackingController", () => {
  const TENANT_A = { id: 7, uid: "u7", email: "a@b.com", roles: [] } as unknown as AuthenticatedTenant;
  const TENANT_B = { id: 8, uid: "u8", email: "b@b.com", roles: [] } as unknown as AuthenticatedTenant;

  /** Tenant 7 owns orders 101 and 102; tenant 8 owns nothing. */
  const ownership = {
    tenantOwnsOrder: async (orderId: number, tenantId: number) => tenantId === 7 && [101, 102].includes(orderId),
    tenantOwnsAnyOrder: async (ids: readonly number[], tenantId: number) =>
      tenantId === 7 && ids.some((i) => [101, 102].includes(i)),
    ownedOrderIds: async (ids: readonly number[], tenantId: number) =>
      new Set(tenantId === 7 ? ids.filter((i) => [101, 102].includes(i)) : []),
  } as unknown as TrackingOwnershipService;

  function makeController(getAll: () => Promise<unknown[]> | never) {
    const fakeService = { getAll } as unknown as TransmissionService;
    return new TrackingController(fakeService, ownership);
  }

  describe("trackByOrderId", () => {
    it("returns tracking when the caller owns the order and a record matches", async () => {
      const controller = makeController(async () => [record({ orderIds: [101, 102] })]);
      const res = await controller.trackByOrderId("101", TENANT_A);
      expect(res).toMatchObject({ success: true, message: "", tracking: { searchedBy: "orderId", searchValue: 101 } });
    });

    it("IDOR: tenant B cannot read tenant A's order, and gets the same message as a miss", async () => {
      const controller = makeController(async () => [record({ orderIds: [101, 102] })]);
      const res = await controller.trackByOrderId("101", TENANT_B);
      expect(res).toEqual({ success: false, message: "No shipment found for Order ID: 101" });
    });

    it("returns a not-found envelope when no record matches an owned order", async () => {
      const controller = makeController(async () => [record({ orderIds: [999] })]);
      const res = await controller.trackByOrderId("101", TENANT_A);
      expect(res).toEqual({ success: false, message: "No shipment found for Order ID: 101" });
    });

    it("rejects a non-numeric order id before touching the service", async () => {
      let called = false;
      const controller = makeController(async () => {
        called = true;
        return [];
      });
      const res = await controller.trackByOrderId("not-a-number", TENANT_A);
      expect(res).toEqual({ success: false, message: "Invalid order ID." });
      expect(called).toBe(false);
    });

    it("propagates a service error instead of swallowing it into not-found", async () => {
      const controller = makeController(async () => {
        throw new Error("db down");
      });
      await expect(controller.trackByOrderId("101", TENANT_A)).rejects.toThrow("db down");
    });
  });

  describe("trackByAwb", () => {
    it("matches trackingNumber case-insensitively for an owner", async () => {
      const controller = makeController(async () => [record({ trackingNumber: "AWB123" })]);
      const res = await controller.trackByAwb("awb123", TENANT_A);
      expect(res).toMatchObject({ success: true, tracking: { searchedBy: "trackingNumber", searchValue: "awb123" } });
    });

    it("IDOR: a non-owner gets not-found even though the AWB exists", async () => {
      const controller = makeController(async () => [record({ trackingNumber: "AWB123" })]);
      const res = await controller.trackByAwb("AWB123", TENANT_B);
      expect(res).toEqual({ success: false, message: "No shipment found for tracking number: AWB123" });
    });

    it("rejects a blank tracking number without calling the service", async () => {
      let called = false;
      const controller = makeController(async () => {
        called = true;
        return [];
      });
      const res = await controller.trackByAwb("   ", TENANT_A);
      expect(res).toEqual({ success: false, message: "Tracking number is required." });
      expect(called).toBe(false);
    });

    it("returns a not-found envelope when no AWB matches", async () => {
      const controller = makeController(async () => [record({ trackingNumber: "OTHER" })]);
      const res = await controller.trackByAwb("AWB123", TENANT_A);
      expect(res).toEqual({ success: false, message: "No shipment found for tracking number: AWB123" });
    });
  });

  describe("trackByBatch", () => {
    it("matches transmissionBatchNo case-insensitively and narrows orderIds to the caller's own", async () => {
      const controller = makeController(async () => [
        record({ transmissionBatchNo: "TRM-2026-0801", orderIds: [101, 555] }),
      ]);
      const res = await controller.trackByBatch("trm-2026-0801", TENANT_A);
      expect(res).toMatchObject({ success: true, tracking: { searchedBy: "batchNo" } });
      // 555 belongs to someone else and must not come back in the batch view.
      expect((res as { tracking: { orderIds: number[] } }).tracking.orderIds).toEqual([101]);
    });

    it("IDOR: a batch containing none of the caller's orders reads as not-found", async () => {
      const controller = makeController(async () => [record({ transmissionBatchNo: "TRM-1", orderIds: [101] })]);
      const res = await controller.trackByBatch("TRM-1", TENANT_B);
      expect(res).toEqual({ success: false, message: "No batch found for: TRM-1" });
    });

    it("returns a not-found envelope when no batch matches", async () => {
      const controller = makeController(async () => [record({ transmissionBatchNo: "OTHER" })]);
      const res = await controller.trackByBatch("TRM-1", TENANT_A);
      expect(res).toEqual({ success: false, message: "No batch found for: TRM-1" });
    });
  });

  describe("getAllTracking", () => {
    it("filters out records with no transmissionBatchNo and maps the rest", async () => {
      const withBatch = record({ transmissionBatchNo: "TRM-1" });
      const withoutBatch = record({ transmissionBatchNo: undefined as unknown as string });
      const controller = makeController(async () => [withBatch, withoutBatch]);
      const res = await controller.getAllTracking();
      expect(res.success).toBe(true);
      expect(res.trackingList).toHaveLength(1);
      expect(res.trackingList[0].batchNo).toBe("TRM-1");
    });

    it("emits no fabricated rows when the table is empty", async () => {
      // TransmissionService no longer substitutes two hardcoded records for an
      // empty table, so an empty store reads as empty.
      const controller = makeController(async () => []);
      await expect(controller.getAllTracking()).resolves.toEqual({ success: true, message: "", trackingList: [] });
    });

    it("drops a batch row that carries no tracking information rather than rendering it blank", async () => {
      const hollow = {
        id: "9",
        name: "x",
        createdAt: "2026-01-10T00:00:00.000Z",
        updatedAt: "2026-01-10T00:00:00.000Z",
        payload: { transmissionBatchNo: "   " } as TrackingRecord["payload"],
      };
      const controller = makeController(async () => [hollow]);
      const res = await controller.getAllTracking();
      expect(res.trackingList).toEqual([]);
    });

    it("propagates a service error rather than reporting success with an empty list", async () => {
      const controller = makeController(async () => {
        throw new Error("db down");
      });
      await expect(controller.getAllTracking()).rejects.toThrow("db down");
    });
  });
});
