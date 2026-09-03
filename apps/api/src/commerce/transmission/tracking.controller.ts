import { Controller, Get, Logger, Param, UseGuards } from "@nestjs/common";
import { GateCode } from "../../auth/types/auth.types.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { ApiOperation, ApiParam, ApiTags, ApiResponse } from "@nestjs/swagger";
import { TransmissionService } from "./transmission.service.js";
import { simpleResponse } from "../../common/response/rain-response.js";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";
import { TrackingOwnershipService } from "./tracking.service.js";

export interface TransmissionPayload {
  transmissionBatchNo: string;
  carrierName: string;
  trackingNumber: string;
  orderIds: number[];
  destinationHub: string;
  status: string;
}

export interface TrackingRecord {
  id: string;
  name: string;
  payload: TransmissionPayload;
  createdAt: string;
  updatedAt: string;
}

/** A tracking view carries only what the stored record actually says. */
export interface TrackingView {
  searchedBy: string;
  searchValue: string | number;
  batchNo: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  orderIds: number[];
  currentStatus: string | null;
  destinationHub: string | null;
  /** When the dispatch record was created. Null when the row carries no timestamp. */
  recordedAt: string | null;
  /**
   * Always null today: TransmissionPayload has no carrier ETA field and the
   * schema stores none. It used to be synthesized as recordedAt + 7 days and
   * shown to customers as a delivery estimate. A missing estimate is reported
   * as missing; it is never invented. See docs/KNOWN-GAPS.md.
   */
  estimatedDelivery: null;
  /**
   * Only events the record can evidence — i.e. the one status it carries, at
   * the one timestamp it carries. The previous ORDER_PLACED / DISPATCHED /
   * IN_TRANSIT / DELIVERED ladder was fabricated from arithmetic on
   * createdAt (-1d, +1d, +5d) with descriptions to match.
   */
  timeline: { status: string; timestamp: string | null }[];
}

const str = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : null;
};

/**
 * Exported so it can be unit-tested directly as a pure function.
 *
 * Returns null when the record carries no tracking information at all — the
 * caller must then say so rather than render an empty-but-plausible envelope.
 */
export function buildTrackingResponse(
  record: TrackingRecord,
  searchedBy: string,
  searchValue: string | number,
): TrackingView | null {
  const p = record?.payload;
  const batchNo = str(p?.transmissionBatchNo);
  const carrier = str(p?.carrierName);
  const trackingNumber = str(p?.trackingNumber);
  const currentStatus = str(p?.status);
  const destinationHub = str(p?.destinationHub);
  const orderIds = Array.isArray(p?.orderIds) ? p.orderIds.map(Number).filter(Number.isFinite) : [];

  // Nothing the record can actually attest to -> no tracking information.
  if (!batchNo && !carrier && !trackingNumber && !currentStatus && orderIds.length === 0) return null;

  // The row's own creation time, and only if it parses. No `|| Date.now()`
  // fallback: "when we wrote the row" must not be silently replaced by "now".
  const recordedAtMs = record?.createdAt ? Date.parse(String(record.createdAt)) : NaN;
  const recordedAt = Number.isFinite(recordedAtMs) ? new Date(recordedAtMs).toISOString() : null;

  return {
    searchedBy,
    searchValue,
    batchNo,
    carrier,
    trackingNumber,
    orderIds,
    currentStatus,
    destinationHub,
    recordedAt,
    estimatedDelivery: null,
    timeline: currentStatus ? [{ status: currentStatus, timestamp: recordedAt }] : [],
  };
}

@Controller("track")
@UseGuards(RolesGuard)
@ApiTags("Tracking")
export class TrackingController {
  private readonly logger = new Logger(TrackingController.name);

  constructor(
    private readonly transmissionService: TransmissionService,
    private readonly ownership: TrackingOwnershipService,
  ) {}

  /**
   * One place that reads the transmission records, so a DB failure is logged
   * and propagated instead of being swallowed into "no shipment found" —
   * which is what the three catch blocks here used to do.
   */
  private async records(): Promise<TrackingRecord[]> {
    const list = await this.transmissionService.getAll();
    return Array.isArray(list) ? (list as TrackingRecord[]) : [];
  }

  private orderIdsOf(record: TrackingRecord): number[] {
    return Array.isArray(record.payload?.orderIds) ? record.payload.orderIds.map(Number) : [];
  }

  @Get("order/:orderId")
  @ApiOperation({ summary: "Track your own shipment by Order ID" })
  @ApiParam({ name: "orderId", example: "101", description: "Your order ID" })
  @ApiResponse({ status: 200, description: "Tracking info for the order" })
  @RequireGate(GateCode.CODE_CU)
  async trackByOrderId(@Param("orderId") orderId: string, @CurrentTenant() tenant: AuthenticatedTenant) {
    const id = Number(orderId);
    if (!Number.isSafeInteger(id) || id <= 0) return simpleResponse(false, "Invalid order ID.");

    // Ownership FIRST, and the same message either way: an order that is not
    // yours must be indistinguishable from an order with no shipment, or the
    // route is still an existence oracle over every order id.
    const notFound = simpleResponse(false, `No shipment found for Order ID: ${id}`);
    if (!(await this.ownership.tenantOwnsOrder(id, tenant.id))) return notFound;

    const found = (await this.records()).find((r) => this.orderIdsOf(r).includes(id));
    if (!found) return notFound;

    const tracking = buildTrackingResponse(found, "orderId", id);
    if (!tracking) return simpleResponse(false, `No tracking information available for Order ID: ${id}`);
    return { success: true, message: "", tracking };
  }

  @Get("awb/:trackingNumber")
  @ApiOperation({ summary: "Track your own shipment by AWB / Tracking Number" })
  @ApiParam({ name: "trackingNumber", example: "BLUEDART88472910", description: "Carrier AWB / Tracking Number" })
  @ApiResponse({ status: 200, description: "Tracking info for the AWB" })
  @RequireGate(GateCode.CODE_CU)
  async trackByAwb(@Param("trackingNumber") trackingNumber: string, @CurrentTenant() tenant: AuthenticatedTenant) {
    if (!trackingNumber?.trim()) return simpleResponse(false, "Tracking number is required.");

    const notFound = simpleResponse(false, `No shipment found for tracking number: ${trackingNumber}`);
    const found = (await this.records()).find(
      (r) => r.payload?.trackingNumber?.toLowerCase() === trackingNumber.toLowerCase(),
    );
    if (!found) return notFound;
    // An AWB is not a secret and a shipment may carry several customers'
    // orders, so the caller must own one of them.
    if (!(await this.ownership.tenantOwnsAnyOrder(this.orderIdsOf(found), tenant.id))) return notFound;

    const tracking = buildTrackingResponse(found, "trackingNumber", trackingNumber);
    if (!tracking) {
      return simpleResponse(false, `No tracking information available for tracking number: ${trackingNumber}`);
    }
    return { success: true, message: "", tracking };
  }

  @Get("batch/:batchNo")
  @ApiOperation({ summary: "Track your own orders inside a dispatch batch" })
  @ApiParam({ name: "batchNo", example: "TRM-2026-0801", description: "Transmission Batch Number" })
  @RequireGate(GateCode.CODE_CU)
  async trackByBatch(@Param("batchNo") batchNo: string, @CurrentTenant() tenant: AuthenticatedTenant) {
    if (!batchNo?.trim()) return simpleResponse(false, "Batch number is required.");

    const notFound = simpleResponse(false, `No batch found for: ${batchNo}`);
    const found = (await this.records()).find(
      (r) => r.payload?.transmissionBatchNo?.toLowerCase() === batchNo.toLowerCase(),
    );
    if (!found) return notFound;

    // Batch numbers are sequential-ish (TRM-2026-0801), so this is the same
    // enumeration risk as the order id. Narrow the payload to the caller's own
    // orders rather than handing back the whole batch.
    const owned = await this.ownership.ownedOrderIds(this.orderIdsOf(found), tenant.id);
    if (owned.size === 0) return notFound;

    const scoped: TrackingRecord = {
      ...found,
      payload: { ...found.payload, orderIds: [...owned] },
    };
    const tracking = buildTrackingResponse(scoped, "batchNo", batchNo);
    if (!tracking) return simpleResponse(false, `No tracking information available for batch: ${batchNo}`);
    return { success: true, message: "", tracking };
  }

  @Get("all")
  @ApiOperation({ summary: "Get all active dispatch batches & their tracking status" })
  @RequireGate(GateCode.CODE_SU)
  async getAllTracking() {
    // Super-user only, deliberately: this is the one cross-tenant view.
    // This is the batch view, so a row with no batch number is not a batch.
    // The trailing null-drop is the second guard: a row that carries no
    // tracking information at all is omitted rather than rendered blank.
    const trackingList = (await this.records())
      .filter((r) => r.payload?.transmissionBatchNo)
      .map((r) => buildTrackingResponse(r, "all", r.payload.transmissionBatchNo))
      .filter((t): t is TrackingView => t !== null);
    return { success: true, message: "", trackingList };
  }
}
