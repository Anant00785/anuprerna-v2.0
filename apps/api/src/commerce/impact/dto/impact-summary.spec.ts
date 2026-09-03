/**
 * Loom's ImpactSummary / ImpactAggregationSummary construction:
 *   CustomImpactFactorDAOController.buildOrderSummary + buildImpactItem
 *   ImpactAggregationSummary.firstOrEmpty
 */
import { describe, it, expect } from "vitest";
import {
  buildCustomOrderImpactSummary,
  emptyImpactSummary,
  toImpactAggregation,
} from "./impact-summary.js";

// pg hands numeric columns back as strings — the summing must survive that.
const row = (over: Record<string, unknown> = {}) => ({
  workflowId: 3,
  customOrderItemId: 11,
  productType: "FABRIC",
  calculationStatus: "COMPLETE",
  pendingReason: null,
  fabricMeters: "2.50",
  co2OffsetKg: "1.25",
  waterSavedLitres: "100.00",
  artisanHours: "4.00",
  womenArtisanHours: "3.00",
  stitchingHours: "1.00",
  womenStitchingHours: "0.50",
  totalWorkHours: "5.00",
  assumptionVersion: 1,
  updatedAt: 1700000000000,
  ...over,
});

describe("buildCustomOrderImpactSummary", () => {
  it("sums every metric across the rows", () => {
    const s = buildCustomOrderImpactSummary(5, [row(), row()]);
    expect(s.fabricMeters).toBe(5);
    expect(s.co2OffsetKg).toBe(2.5);
    expect(s.waterSavedLitres).toBe(200);
    expect(s.totalWorkHours).toBe(10);
    expect(s.orderId).toBe(5);
  });

  it("counts COMPLETE items separately from everything else", () => {
    const s = buildCustomOrderImpactSummary(5, [
      row(),
      row({ calculationStatus: "PARTIAL" }),
      row({ calculationStatus: "PENDING" }),
    ]);
    expect(s.completeItems).toBe(1);
    expect(s.partialItems).toBe(2);
  });

  it("treats null metrics as zero (Loom's safe()) without dropping the item", () => {
    const s = buildCustomOrderImpactSummary(5, [row({ fabricMeters: null, co2OffsetKg: null })]);
    expect(s.fabricMeters).toBe(0);
    expect(s.co2OffsetKg).toBe(0);
    expect(s.items).toHaveLength(1);
    expect(s.items[0].fabricMeters).toBeNull();
  });

  it("maps customOrderItemId onto the item's orderItemId", () => {
    const s = buildCustomOrderImpactSummary(5, [row({ customOrderItemId: 99 })]);
    expect(s.items[0].orderItemId).toBe(99);
  });

  it("is the empty summary when there are no rows", () => {
    expect(buildCustomOrderImpactSummary(5, [])).toEqual(emptyImpactSummary(5));
  });
});

describe("toImpactAggregation", () => {
  it("maps the snake_case SQL row, coercing pg's bigint strings", () => {
    expect(
      toImpactAggregation({
        total_orders: "3",
        total_items: "7",
        complete_items: "5",
        partial_items: "2",
        fabric_items: "4",
        apparel_items: "3",
        fabric_meters: 12.5,
        co2_offset_kg: 6,
        water_saved_litres: 500,
        artisan_hours: 20,
        women_artisan_hours: 15,
        stitching_hours: 5,
        women_stitching_hours: 4,
        total_work_hours: 25,
      }),
    ).toEqual({
      totalOrders: 3,
      totalItems: 7,
      completeItems: 5,
      partialItems: 2,
      fabricItems: 4,
      apparelItems: 3,
      fabricMeters: 12.5,
      co2OffsetKg: 6,
      waterSavedLitres: 500,
      artisanHours: 20,
      womenArtisanHours: 15,
      stitchingHours: 5,
      womenStitchingHours: 4,
      totalWorkHours: 25,
    });
  });

  it("is all zeroes when the query returned no row (Loom's firstOrEmpty)", () => {
    expect(toImpactAggregation(null)).toEqual({
      totalOrders: 0, totalItems: 0, completeItems: 0, partialItems: 0,
      fabricItems: 0, apparelItems: 0, fabricMeters: 0, co2OffsetKg: 0,
      waterSavedLitres: 0, artisanHours: 0, womenArtisanHours: 0,
      stitchingHours: 0, womenStitchingHours: 0, totalWorkHours: 0,
    });
  });
});
