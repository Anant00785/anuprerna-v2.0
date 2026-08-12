import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags, ApiResponse } from "@nestjs/swagger";
import { TransmissionService } from "./transmission.service.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";

interface TransmissionPayload {
  transmissionBatchNo: string;
  carrierName: string;
  trackingNumber: string;
  orderIds: number[];
  destinationHub: string;
  status: string;
}

interface TrackingRecord {
  id: string;
  name: string;
  payload: TransmissionPayload;
  createdAt: string;
  updatedAt: string;
}

function buildTrackingResponse(record: TrackingRecord, searchedBy: string, searchValue: string | number) {
  const p = record.payload;
  const dispatched = new Date(record.createdAt || Date.now());
  const estimatedDelivery = new Date(dispatched);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

  const timeline: { status: string; description: string; timestamp: string }[] = [
    {
      status: "ORDER_PLACED",
      description: "Order placed and confirmed",
      timestamp: new Date(dispatched.getTime() - 86400000).toISOString(),
    },
    {
      status: "DISPATCHED",
      description: `Dispatched from warehouse via ${p?.carrierName || "Courier"}`,
      timestamp: dispatched.toISOString(),
    },
  ];

  if (p?.status && ["IN_TRANSIT", "DELIVERED"].includes(p.status)) {
    timeline.push({
      status: "IN_TRANSIT",
      description: `Package in transit — heading to ${p.destinationHub || "Destination"}`,
      timestamp: new Date(dispatched.getTime() + 86400000).toISOString(),
    });
  }

  if (p?.status === "DELIVERED") {
    timeline.push({
      status: "DELIVERED",
      description: `Delivered to ${p.destinationHub || "Destination"}`,
      timestamp: new Date(dispatched.getTime() + 5 * 86400000).toISOString(),
    });
  }

  return {
    searchedBy,
    searchValue,
    batchNo: p?.transmissionBatchNo,
    carrier: p?.carrierName,
    trackingNumber: p?.trackingNumber,
    orderIds: p?.orderIds,
    currentStatus: p?.status,
    destinationHub: p?.destinationHub,
    dispatchedAt: dispatched.toISOString(),
    estimatedDelivery: estimatedDelivery.toISOString(),
    timeline,
  };
}

@Controller("track")
@ApiTags("Tracking")
export class TrackingController {
  constructor(private readonly transmissionService: TransmissionService) {}

  @Get("order/:orderId")
  @ApiOperation({ summary: "Track shipment by Order ID" })
  @ApiParam({ name: "orderId", example: "101", description: "Loom Order ID (e.g. 101, 102, 103, 105, 106, 108)" })
  @ApiResponse({ status: 200, description: "Tracking info for the order" })
  @ApiResponse({ status: 404, description: "No shipment found for this order" })
  async trackByOrderId(@Param("orderId") orderId: string) {
    const id = Number(orderId);
    if (isNaN(id)) return simpleResponse(false, "Invalid order ID.");

    try {
      const records: TrackingRecord[] = (await this.transmissionService.getAll()) || [];
      const found = records.find((r) =>
        Array.isArray(r.payload?.orderIds) && r.payload.orderIds.includes(id)
      );

      if (!found) {
        return simpleResponse(false, `No shipment found for Order ID: ${id}`);
      }

      return { success: true, message: "", tracking: buildTrackingResponse(found, "orderId", id) };
    } catch {
      return simpleResponse(false, `No shipment found for Order ID: ${id}`);
    }
  }

  @Get("awb/:trackingNumber")
  @ApiOperation({ summary: "Track shipment by AWB / Tracking Number" })
  @ApiParam({ name: "trackingNumber", example: "BLUEDART88472910", description: "Carrier AWB / Tracking Number" })
  @ApiResponse({ status: 200, description: "Tracking info for the AWB" })
  async trackByAwb(@Param("trackingNumber") trackingNumber: string) {
    if (!trackingNumber?.trim()) return simpleResponse(false, "Tracking number is required.");

    try {
      const records: TrackingRecord[] = (await this.transmissionService.getAll()) || [];
      const found = records.find((r) =>
        r.payload?.trackingNumber?.toLowerCase() === trackingNumber.toLowerCase()
      );

      if (!found) {
        return simpleResponse(false, `No shipment found for tracking number: ${trackingNumber}`);
      }

      return { success: true, message: "", tracking: buildTrackingResponse(found, "trackingNumber", trackingNumber) };
    } catch {
      return simpleResponse(false, `No shipment found for tracking number: ${trackingNumber}`);
    }
  }

  @Get("batch/:batchNo")
  @ApiOperation({ summary: "Track all orders in a dispatch batch" })
  @ApiParam({ name: "batchNo", example: "TRM-2026-0801", description: "Transmission Batch Number" })
  async trackByBatch(@Param("batchNo") batchNo: string) {
    try {
      const records: TrackingRecord[] = (await this.transmissionService.getAll()) || [];
      const found = records.find((r) =>
        r.payload?.transmissionBatchNo?.toLowerCase() === batchNo.toLowerCase()
      );

      if (!found) {
        return simpleResponse(false, `No batch found for: ${batchNo}`);
      }

      return { success: true, message: "", tracking: buildTrackingResponse(found, "batchNo", batchNo) };
    } catch {
      return simpleResponse(false, `No batch found for: ${batchNo}`);
    }
  }

  @Get("all")
  @ApiOperation({ summary: "Get all active dispatch batches & their tracking status" })
  async getAllTracking() {
    try {
      const records: TrackingRecord[] = (await this.transmissionService.getAll()) || [];
      const valid = records.filter((r) => r.payload?.transmissionBatchNo);
      const trackingList = valid.map((r) => buildTrackingResponse(r, "all", r.payload.transmissionBatchNo));
      return { success: true, message: "", trackingList };
    } catch {
      return { success: true, message: "", trackingList: [] };
    }
  }
}
