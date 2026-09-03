/**
 * Port of Loom `impact/service/CustomImpactCalculationService.java`.
 *
 * Pure arithmetic, no I/O — every number below comes from the administered
 * ImpactAssumptions row and the workflow's own planning metrics. There is no
 * default, no constant and no fallback anywhere in this file: an input that is
 * missing produces a PARTIAL row whose `pendingReason` names the missing input,
 * exactly as the Java does. That is what distinguishes a measured zero from an
 * unknown, and it is why the previous fabricated fallback was removed.
 *
 * The formulas, verbatim from the Java:
 *
 *   FABRIC  (productGroup 'fabric', case-insensitive)
 *     fabricMeters       = quantity
 *     co2OffsetKg        = quantity * carbonDioxideSavedKgPerMeter
 *     waterSavedLitres   = quantity * waterSavedLitersPerMeter
 *     artisanHours       = quantity * workflow.avgArtisanWorkHoursPerMeter
 *     totalWorkHours     = artisanHours
 *     womenArtisanHours  = totalWorkHours * womenArtisanWorkPercentage
 *     stitchingHours     = 0
 *
 *   APPAREL (productGroup 'finished', case-insensitive)
 *     totalWorkHours      = quantity * workflow.avgWorkHoursPerProduct
 *     stitchingHours      = totalWorkHours
 *     womenStitchingHours = totalWorkHours * womenStitchingWorkPercentage
 *     (no fabricMeters, and therefore NO environmental metrics — Java calls
 *      applyEnvironmentalMetrics only from calculateFabricImpact)
 */
import { Injectable } from "@nestjs/common";
import type { ImpactAssumptions } from "../dto/impact-assumptions.js";

/** Loom: impact/orm/IMPACT_PRODUCT_TYPE. */
export type ImpactProductType = "FABRIC" | "APPAREL";

/** Loom: impact/orm/IMPACT_CALCULATION_STATUS. */
export type ImpactCalculationStatus = "COMPLETE" | "PARTIAL";

export const WORKFLOW_NOT_CONFIGURED = "WORKFLOW_NOT_CONFIGURED";
export const AVG_ARTISAN_WORK_HOURS_NOT_CONFIGURED = "AVG_ARTISAN_WORK_HOURS_PER_METER_NOT_CONFIGURED";
export const AVG_WORK_HOURS_NOT_CONFIGURED = "AVG_WORK_HOURS_PER_PRODUCT_NOT_CONFIGURED";
export const UNSUPPORTED_PRODUCT_GROUP = "UNSUPPORTED_PRODUCT_GROUP";
export const SWATCH_PRODUCT_EXCLUDED = "SWATCH_PRODUCT_EXCLUDED";

const SWATCH_PRODUCT_NAME_MARKER = "swatch";

/** The workflow planning metrics the calculation reads. */
export interface ImpactWorkflowMetrics {
  id: number;
  avgArtisanWorkHoursPerMeter: number | null;
  avgWorkHoursPerProduct: number | null;
}

/** The metric block written onto a custom_impact_factor row. */
export interface ImpactMetrics {
  fabricMeters: number | null;
  co2OffsetKg: number | null;
  waterSavedLitres: number | null;
  artisanHours: number | null;
  womenArtisanHours: number | null;
  stitchingHours: number | null;
  womenStitchingHours: number | null;
  totalWorkHours: number | null;
  calculationStatus: ImpactCalculationStatus;
  pendingReason: string | null;
}

/** Loom's clearMetrics(): every metric starts null, not zero. */
function clearedMetrics(): ImpactMetrics {
  return {
    fabricMeters: null,
    co2OffsetKg: null,
    waterSavedLitres: null,
    artisanHours: null,
    womenArtisanHours: null,
    stitchingHours: null,
    womenStitchingHours: null,
    totalWorkHours: null,
    calculationStatus: "PARTIAL",
    pendingReason: null,
  };
}

@Injectable()
export class CustomImpactCalculationService {
  /** Loom: resolveProductType — only 'fabric' and 'finished' are supported. */
  resolveProductType(productGroup: string | null | undefined): ImpactProductType | null {
    if (productGroup == null) return null;
    const group = productGroup.toLowerCase();
    if (group === "fabric") return "FABRIC";
    if (group === "finished") return "APPAREL";
    return null;
  }

  /** Loom: supportsCustomImpact. */
  supportsCustomImpact(productGroup: string | null | undefined): boolean {
    return this.resolveProductType(productGroup) !== null;
  }

  /**
   * Loom: isSwatchProduct — a fabric item whose product NAME contains "swatch".
   * A swatch is a sample cutting, so counting it as fabric output would inflate
   * every environmental total.
   */
  isSwatchProduct(productGroup: string | null | undefined, productName: string | null | undefined): boolean {
    if (productName == null || productGroup == null) return false;
    return productGroup.toLowerCase() === "fabric" && productName.toLowerCase().includes(SWATCH_PRODUCT_NAME_MARKER);
  }

  /** Loom: calculateFabricImpact. */
  private calculateFabricImpact(
    metrics: ImpactMetrics,
    workflow: ImpactWorkflowMetrics | null,
    quantity: number,
    assumptions: ImpactAssumptions,
  ): void {
    metrics.fabricMeters = quantity;
    // Loom: applyEnvironmentalMetrics — fabric only.
    metrics.co2OffsetKg = quantity * assumptions.carbonDioxideSavedKgPerMeter;
    metrics.waterSavedLitres = quantity * assumptions.waterSavedLitersPerMeter;

    if (workflow === null) {
      metrics.calculationStatus = "PARTIAL";
      metrics.pendingReason = WORKFLOW_NOT_CONFIGURED;
      return;
    }
    if (workflow.avgArtisanWorkHoursPerMeter === null) {
      metrics.calculationStatus = "PARTIAL";
      metrics.pendingReason = AVG_ARTISAN_WORK_HOURS_NOT_CONFIGURED;
      return;
    }

    const totalWorkHours = quantity * workflow.avgArtisanWorkHoursPerMeter;
    metrics.artisanHours = totalWorkHours;
    metrics.totalWorkHours = totalWorkHours;
    metrics.womenArtisanHours = totalWorkHours * assumptions.womenArtisanWorkPercentage;
    metrics.stitchingHours = 0;
    metrics.calculationStatus = "COMPLETE";
    metrics.pendingReason = null;
  }

  /** Loom: calculateApparelImpact. */
  private calculateApparelImpact(
    metrics: ImpactMetrics,
    workflow: ImpactWorkflowMetrics | null,
    quantity: number,
    assumptions: ImpactAssumptions,
  ): void {
    if (workflow === null) {
      metrics.calculationStatus = "PARTIAL";
      metrics.pendingReason = WORKFLOW_NOT_CONFIGURED;
      return;
    }
    if (workflow.avgWorkHoursPerProduct === null) {
      metrics.calculationStatus = "PARTIAL";
      metrics.pendingReason = AVG_WORK_HOURS_NOT_CONFIGURED;
      return;
    }

    const totalWorkHours = quantity * workflow.avgWorkHoursPerProduct;
    metrics.totalWorkHours = totalWorkHours;
    metrics.stitchingHours = totalWorkHours;
    metrics.womenStitchingHours = totalWorkHours * assumptions.womenStitchingWorkPercentage;
    metrics.calculationStatus = "COMPLETE";
    metrics.pendingReason = null;
  }

  /**
   * Loom: calculateCustomImpact — the metric half. Row identity (tenant, order,
   * item, timestamps) is applied by the repository; this returns only what the
   * formulas produce, so the arithmetic is testable without a database.
   *
   * Throws on an unsupported product group, as the Java does: callers must have
   * filtered with supportsCustomImpact() first.
   */
  calculateCustomImpact(
    productGroup: string | null | undefined,
    quantity: number,
    workflow: ImpactWorkflowMetrics | null,
    assumptions: ImpactAssumptions,
  ): { productType: ImpactProductType; metrics: ImpactMetrics } {
    const productType = this.resolveProductType(productGroup);
    if (productType === null) {
      throw new Error("Unsupported custom order item product group for impact calculation.");
    }

    const metrics = clearedMetrics();
    if (productType === "FABRIC") {
      this.calculateFabricImpact(metrics, workflow, quantity, assumptions);
    } else {
      this.calculateApparelImpact(metrics, workflow, quantity, assumptions);
    }
    return { productType, metrics };
  }
}
