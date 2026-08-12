import { describe, it, expect } from "vitest";
import { TrackingController, buildTrackingResponse, type TrackingRecord } from "./tracking.controller.js";
import type { TransmissionService } from "./transmission.service.js";

// NOTE ON REACHABILITY: TrackingController is declared in TransmissionModule
// (transmission.module.ts), but TransmissionModule is never imported by
// CommerceModule (apps/api/src/commerce/commerce.module.ts) or AppModule
// (apps/api/src/app.module.ts) — grepped both, "Transmission" appears
// nowhere in either. So today this controller is not reachable by any real
// HTTP request despite the feature commit message ("add real transmission
// tracking module"). Tests below characterize the code as written; they do
// not imply it is live.

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

describe("buildTrackingResponse (pure)", () => {
  it("sets dispatchedAt to createdAt verbatim", () => {
    const r = buildTrackingResponse(record(), "orderId", 101);
    expect(r.dispatchedAt).toBe("2026-01-10T00:00:00.000Z");
  });

  it("BUG: estimatedDelivery is synthesized as createdAt + 7 days, not a real carrier ETA", () => {
    // apps/api/src/commerce/transmission/tracking.controller.ts:26-27 — there is no
    // delivery-estimate field anywhere in TransmissionPayload; this is computed,
    // not sourced. Per docs/TESTING.md §5, pinning as-is; not fixing.
    const r = buildTrackingResponse(record(), "orderId", 101);
    expect(r.estimatedDelivery).toBe("2026-01-17T00:00:00.000Z");
  });

  it("BUG: the ORDER_PLACED timeline entry is fabricated as createdAt - 1 day, not a real event", () => {
    // apps/api/src/commerce/transmission/tracking.controller.ts:30-34 — there is no
    // order-placed timestamp in the payload; the transmission record's own
    // createdAt is presented as if it were shipment history one day earlier.
    const r = buildTrackingResponse(record(), "orderId", 101);
    expect(r.timeline[0]).toEqual({
      status: "ORDER_PLACED",
      description: "Order placed and confirmed",
      timestamp: "2026-01-09T00:00:00.000Z",
    });
  });

  it("always includes a DISPATCHED entry at createdAt, naming the carrier", () => {
    const r = buildTrackingResponse(record({ carrierName: "Delhivery" }), "orderId", 101);
    expect(r.timeline[1]).toEqual({
      status: "DISPATCHED",
      description: "Dispatched from warehouse via Delhivery",
      timestamp: "2026-01-10T00:00:00.000Z",
    });
  });

  it("falls back to 'Courier' and 'Destination' when carrierName/destinationHub are missing", () => {
    const r = buildTrackingResponse(
      record({ carrierName: undefined as unknown as string, destinationHub: undefined as unknown as string, status: "IN_TRANSIT" }),
      "orderId",
      101,
    );
    expect(r.timeline[1].description).toBe("Dispatched from warehouse via Courier");
    expect(r.timeline[2].description).toContain("heading to Destination");
  });

  it("adds no IN_TRANSIT/DELIVERED entries for a status outside that set (e.g. still DISPATCHED)", () => {
    const r = buildTrackingResponse(record({ status: "DISPATCHED" }), "orderId", 101);
    expect(r.timeline).toHaveLength(2);
    expect(r.timeline.map((t) => t.status)).toEqual(["ORDER_PLACED", "DISPATCHED"]);
  });

  it("adds an IN_TRANSIT entry (createdAt + 1 day) when status is IN_TRANSIT, without a DELIVERED entry", () => {
    const r = buildTrackingResponse(record({ status: "IN_TRANSIT" }), "orderId", 101);
    expect(r.timeline).toHaveLength(3);
    expect(r.timeline[2]).toEqual({
      status: "IN_TRANSIT",
      description: "Package in transit — heading to Mumbai Hub",
      timestamp: "2026-01-11T00:00:00.000Z",
    });
  });

  it("adds both IN_TRANSIT and DELIVERED entries, in order, when status is DELIVERED", () => {
    const r = buildTrackingResponse(record({ status: "DELIVERED" }), "orderId", 101);
    expect(r.timeline.map((t) => t.status)).toEqual(["ORDER_PLACED", "DISPATCHED", "IN_TRANSIT", "DELIVERED"]);
    expect(r.timeline[3]).toEqual({
      status: "DELIVERED",
      description: "Delivered to Mumbai Hub",
      timestamp: "2026-01-15T00:00:00.000Z",
    });
  });

  it("passes through searchedBy/searchValue and the payload fields verbatim into the envelope", () => {
    const r = buildTrackingResponse(record(), "trackingNumber", "AWB123");
    expect(r.searchedBy).toBe("trackingNumber");
    expect(r.searchValue).toBe("AWB123");
    expect(r.batchNo).toBe("TRM-1");
    expect(r.carrier).toBe("BlueDart");
    expect(r.trackingNumber).toBe("AWB123");
    expect(r.orderIds).toEqual([101, 102]);
    expect(r.currentStatus).toBe("DISPATCHED");
    expect(r.destinationHub).toBe("Mumbai Hub");
  });
});

describe("TrackingController", () => {
  function makeController(getAll: () => Promise<unknown[]> | never) {
    const fakeService = { getAll } as unknown as TransmissionService;
    return new TrackingController(fakeService);
  }

  describe("trackByOrderId", () => {
    it("returns tracking when a record's payload.orderIds includes the id", async () => {
      const controller = makeController(async () => [record({ orderIds: [101, 102] })]);
      const res = await controller.trackByOrderId("101");
      expect(res).toMatchObject({ success: true, message: "", tracking: { searchedBy: "orderId", searchValue: 101 } });
    });

    it("returns a not-found envelope when no record matches", async () => {
      const controller = makeController(async () => [record({ orderIds: [999] })]);
      const res = await controller.trackByOrderId("101");
      expect(res).toEqual({ success: false, message: "No shipment found for Order ID: 101" });
    });

    it("rejects a non-numeric order id before calling the service", async () => {
      let called = false;
      const controller = makeController(async () => {
        called = true;
        return [];
      });
      const res = await controller.trackByOrderId("not-a-number");
      expect(res).toEqual({ success: false, message: "Invalid order ID." });
      expect(called).toBe(false);
    });

    it("catches a service error and reports not-found rather than throwing", async () => {
      const controller = makeController(async () => {
        throw new Error("db down");
      });
      const res = await controller.trackByOrderId("101");
      expect(res).toEqual({ success: false, message: "No shipment found for Order ID: 101" });
    });
  });

  describe("trackByAwb", () => {
    it("matches trackingNumber case-insensitively", async () => {
      const controller = makeController(async () => [record({ trackingNumber: "AWB123" })]);
      const res = await controller.trackByAwb("awb123");
      expect(res).toMatchObject({ success: true, tracking: { searchedBy: "trackingNumber", searchValue: "awb123" } });
    });

    it("rejects a blank/whitespace-only tracking number without calling the service", async () => {
      let called = false;
      const controller = makeController(async () => {
        called = true;
        return [];
      });
      const res = await controller.trackByAwb("   ");
      expect(res).toEqual({ success: false, message: "Tracking number is required." });
      expect(called).toBe(false);
    });

    it("returns a not-found envelope when no AWB matches", async () => {
      const controller = makeController(async () => [record({ trackingNumber: "OTHER" })]);
      const res = await controller.trackByAwb("AWB123");
      expect(res).toEqual({ success: false, message: "No shipment found for tracking number: AWB123" });
    });
  });

  describe("trackByBatch", () => {
    it("matches transmissionBatchNo case-insensitively", async () => {
      const controller = makeController(async () => [record({ transmissionBatchNo: "TRM-2026-0801" })]);
      const res = await controller.trackByBatch("trm-2026-0801");
      expect(res).toMatchObject({ success: true, tracking: { searchedBy: "batchNo" } });
    });

    it("returns a not-found envelope when no batch matches", async () => {
      const controller = makeController(async () => [record({ transmissionBatchNo: "OTHER" })]);
      const res = await controller.trackByBatch("TRM-1");
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

    it("BUG (asymmetric with the other three endpoints): on a service error, returns success:true with an empty list instead of success:false", async () => {
      // apps/api/src/commerce/transmission/tracking.controller.ts:149-156 — trackByOrderId/
      // trackByAwb/trackByBatch all report `success: false` on a caught error; getAllTracking's
      // catch swallows it into a *successful* empty response, which a caller cannot distinguish
      // from "there are genuinely zero batches". Pinning current behaviour, not fixing.
      const controller = makeController(async () => {
        throw new Error("db down");
      });
      const res = await controller.getAllTracking();
      expect(res).toEqual({ success: true, message: "", trackingList: [] });
    });
  });
});
