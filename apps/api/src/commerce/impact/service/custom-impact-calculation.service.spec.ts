/**
 * The arithmetic of Loom `CustomImpactCalculationService`.
 *
 * Every expected number below is worked out from the JAVA source, not from
 * this implementation's output:
 *
 *   assumptions (the fixture): co2 = 2.5 kg/m, water = 90 L/m,
 *                              womenArtisan = 0.75, womenStitching = 0.80
 *
 *   FABRIC, quantity 4 m, avgArtisanWorkHoursPerMeter 1.5
 *     fabricMeters      = 4
 *     co2OffsetKg       = 4 * 2.5  = 10
 *     waterSavedLitres  = 4 * 90   = 360
 *     artisanHours      = 4 * 1.5  = 6
 *     totalWorkHours    = 6
 *     womenArtisanHours = 6 * 0.75 = 4.5
 *     stitchingHours    = 0
 *
 *   APPAREL, quantity 3 units, avgWorkHoursPerProduct 2.5
 *     totalWorkHours      = 3 * 2.5 = 7.5
 *     stitchingHours      = 7.5
 *     womenStitchingHours = 7.5 * 0.80 = 6
 *     fabricMeters / co2 / water stay NULL — the Java calls
 *     applyEnvironmentalMetrics only from calculateFabricImpact.
 */
import { describe, it, expect } from "vitest";
import {
  AVG_ARTISAN_WORK_HOURS_NOT_CONFIGURED,
  AVG_WORK_HOURS_NOT_CONFIGURED,
  CustomImpactCalculationService,
  WORKFLOW_NOT_CONFIGURED,
} from "./custom-impact-calculation.service.js";
import type { ImpactAssumptions } from "../dto/impact-assumptions.js";

const assumptions: ImpactAssumptions = {
  assumptionVersion: 3,
  carbonDioxideSavedKgPerMeter: 2.5,
  waterSavedLitersPerMeter: 90,
  womenArtisanWorkPercentage: 0.75,
  womenStitchingWorkPercentage: 0.8,
};

const service = new CustomImpactCalculationService();

describe("resolveProductType / supportsCustomImpact", () => {
  it("maps only 'fabric' and 'finished', case-insensitively", () => {
    expect(service.resolveProductType("fabric")).toBe("FABRIC");
    expect(service.resolveProductType("FABRIC")).toBe("FABRIC");
    expect(service.resolveProductType("finished")).toBe("APPAREL");
    expect(service.resolveProductType("Finished")).toBe("APPAREL");
  });

  it("refuses every other group, including 'custom' and null", () => {
    expect(service.resolveProductType("custom")).toBeNull();
    expect(service.resolveProductType("swatch")).toBeNull();
    expect(service.resolveProductType(null)).toBeNull();
    expect(service.supportsCustomImpact("custom")).toBe(false);
    expect(service.supportsCustomImpact("fabric")).toBe(true);
  });
});

describe("isSwatchProduct", () => {
  it("is true only for a fabric item whose name contains 'swatch'", () => {
    expect(service.isSwatchProduct("fabric", "Indigo Swatch Set")).toBe(true);
    expect(service.isSwatchProduct("FABRIC", "swatch")).toBe(true);
  });

  it("is false for a finished item, or a fabric item with no marker", () => {
    expect(service.isSwatchProduct("finished", "Swatch Kurta")).toBe(false);
    expect(service.isSwatchProduct("fabric", "Indigo Yardage")).toBe(false);
    expect(service.isSwatchProduct("fabric", null)).toBe(false);
  });
});

describe("FABRIC impact", () => {
  it("computes the Java formulas exactly", () => {
    const { productType, metrics } = service.calculateCustomImpact(
      "fabric",
      4,
      { id: 11, avgArtisanWorkHoursPerMeter: 1.5, avgWorkHoursPerProduct: null },
      assumptions,
    );

    expect(productType).toBe("FABRIC");
    expect(metrics).toEqual({
      fabricMeters: 4,
      co2OffsetKg: 10,
      waterSavedLitres: 360,
      artisanHours: 6,
      womenArtisanHours: 4.5,
      stitchingHours: 0,
      womenStitchingHours: null,
      totalWorkHours: 6,
      calculationStatus: "COMPLETE",
      pendingReason: null,
    });
  });

  it("keeps the environmental metrics but goes PARTIAL with no workflow", () => {
    const { metrics } = service.calculateCustomImpact("fabric", 4, null, assumptions);
    expect(metrics.fabricMeters).toBe(4);
    expect(metrics.co2OffsetKg).toBe(10);
    expect(metrics.waterSavedLitres).toBe(360);
    expect(metrics.artisanHours).toBeNull();
    expect(metrics.totalWorkHours).toBeNull();
    expect(metrics.calculationStatus).toBe("PARTIAL");
    expect(metrics.pendingReason).toBe(WORKFLOW_NOT_CONFIGURED);
  });

  it("names the missing per-meter hours rather than assuming a rate", () => {
    const { metrics } = service.calculateCustomImpact(
      "fabric",
      4,
      { id: 11, avgArtisanWorkHoursPerMeter: null, avgWorkHoursPerProduct: 9 },
      assumptions,
    );
    expect(metrics.artisanHours).toBeNull();
    expect(metrics.calculationStatus).toBe("PARTIAL");
    expect(metrics.pendingReason).toBe(AVG_ARTISAN_WORK_HOURS_NOT_CONFIGURED);
  });
});

describe("APPAREL impact", () => {
  it("computes the Java formulas exactly, and writes NO environmental metrics", () => {
    const { productType, metrics } = service.calculateCustomImpact(
      "finished",
      3,
      { id: 12, avgArtisanWorkHoursPerMeter: null, avgWorkHoursPerProduct: 2.5 },
      assumptions,
    );

    expect(productType).toBe("APPAREL");
    expect(metrics).toEqual({
      fabricMeters: null,
      co2OffsetKg: null,
      waterSavedLitres: null,
      artisanHours: null,
      womenArtisanHours: null,
      stitchingHours: 7.5,
      womenStitchingHours: 6,
      totalWorkHours: 7.5,
      calculationStatus: "COMPLETE",
      pendingReason: null,
    });
  });

  it("goes PARTIAL with no workflow", () => {
    const { metrics } = service.calculateCustomImpact("finished", 3, null, assumptions);
    expect(metrics.calculationStatus).toBe("PARTIAL");
    expect(metrics.pendingReason).toBe(WORKFLOW_NOT_CONFIGURED);
    expect(metrics.totalWorkHours).toBeNull();
  });

  it("names the missing per-product hours rather than assuming a rate", () => {
    const { metrics } = service.calculateCustomImpact(
      "finished",
      3,
      { id: 12, avgArtisanWorkHoursPerMeter: 1.5, avgWorkHoursPerProduct: null },
      assumptions,
    );
    expect(metrics.calculationStatus).toBe("PARTIAL");
    expect(metrics.pendingReason).toBe(AVG_WORK_HOURS_NOT_CONFIGURED);
  });
});

describe("unsupported group", () => {
  it("throws rather than inventing a product type", () => {
    expect(() => service.calculateCustomImpact("custom", 1, null, assumptions)).toThrow(
      /Unsupported custom order item product group/,
    );
  });
});
