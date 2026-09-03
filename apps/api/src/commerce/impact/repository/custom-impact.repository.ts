/**
 * Reads and writes for the custom-order impact ENGINE (Loom
 * `impact/dao/controller/CustomImpactFactorDAOController.calculateCustomOrderImpact`).
 *
 * Kept separate from `impact.repository.ts` so the engine's inputs are all in
 * one place and none of them can silently become a constant.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { IMPACT_ASSUMPTIONS_ATTRIBUTE, parseImpactAssumptions, type ImpactAssumptions } from "../dto/impact-assumptions.js";
import type { ImpactMetrics, ImpactProductType, ImpactWorkflowMetrics } from "../service/custom-impact-calculation.service.js";

/** A custom order, reduced to what the engine needs. Loom: retrieveOrderForImpact. */
export interface ImpactOrder {
  id: number;
  tenantId: number;
}

/** Loom: CustomOrderItem, reduced to the engine's inputs. */
export interface ImpactOrderItem {
  id: number;
  productGroup: string | null;
  quantity: number;
  customization: unknown;
}

/** A transaction handle, or the pooled connection. */
type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

/** pg returns numeric as a string; null stays null. */
function numeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

@Injectable()
export class CustomImpactRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Loom: SettingsDAOController.retrieveImpactAssumptions. Absent, unparseable
   * or incomplete all collapse to null — the engine then writes nothing.
   */
  async findImpactAssumptions(tx: Executor = this.db): Promise<ImpactAssumptions | null> {
    const rows = await tx
      .select({ value: schema.settings.attributeValue })
      .from(schema.settings)
      .where(eq(schema.settings.attributeName, IMPACT_ASSUMPTIONS_ATTRIBUTE))
      .limit(1);
    if (rows.length === 0) return null;
    return parseImpactAssumptions(rows[0].value);
  }

  /**
   * Loom: retrieveScopedOrder → retrieveOrderForImpact(id) /
   * retrieveOrderForImpact(tenant, id) — `findByIdAndDeletedFalse`.
   * `tenantScopeId` is null only for a super user; it is never client-supplied.
   */
  async findOrderForImpact(
    customOrderId: number,
    tenantScopeId: number | null,
    tx: Executor = this.db,
  ): Promise<ImpactOrder | null> {
    const scoped = eq(schema.customOrder.deleted, false);
    const where =
      tenantScopeId === null
        ? and(eq(schema.customOrder.id, BigInt(customOrderId)), scoped)
        : and(
            eq(schema.customOrder.id, BigInt(customOrderId)),
            eq(schema.customOrder.tenantId, tenantScopeId),
            scoped,
          );
    const rows = await tx
      .select({ id: schema.customOrder.id, tenantId: schema.customOrder.tenantId })
      .from(schema.customOrder)
      .where(where)
      .limit(1);
    if (rows.length === 0) return null;
    return { id: Number(rows[0].id), tenantId: Number(rows[0].tenantId) };
  }

  /** Loom: order.getOrderItems() — the engine iterates them in id order. */
  async findOrderItems(customOrderId: number, tx: Executor = this.db): Promise<ImpactOrderItem[]> {
    const rows = await tx
      .select({
        id: schema.customOrderItem.id,
        productGroup: schema.customOrderItem.productGroup,
        quantity: schema.customOrderItem.quantity,
        customization: schema.customOrderItem.customization,
      })
      .from(schema.customOrderItem)
      .where(eq(schema.customOrderItem.customOrderId, customOrderId))
      .orderBy(schema.customOrderItem.id);
    return rows.map((row) => ({
      id: Number(row.id),
      productGroup: row.productGroup,
      quantity: numeric(row.quantity) ?? 0,
      customization: row.customization,
    }));
  }

  /**
   * Loom: retrieveWorkflowsByCustomOrderItemId — the mappings for this order,
   * keyed by custom order item, dropping rows with no item or no workflow.
   * Loom keeps the FIRST workflow on a duplicate key; `ORDER BY wcom.id` plus a
   * `has` guard reproduces that.
   */
  async findWorkflowMetricsByOrderItem(
    customOrderId: number,
    tx: Executor = this.db,
  ): Promise<Map<number, ImpactWorkflowMetrics>> {
    const rows = await tx
      .select({
        customOrderItemId: schema.workflowCustomOrderMapping.customOrderItemId,
        workflowId: schema.workflow.id,
        avgArtisanWorkHoursPerMeter: schema.workflow.avgArtisanWorkHoursPerMeter,
        avgWorkHoursPerProduct: schema.workflow.avgWorkHoursPerProduct,
      })
      .from(schema.workflowCustomOrderMapping)
      .innerJoin(schema.workflow, eq(schema.workflow.id, schema.workflowCustomOrderMapping.workflowId))
      .where(eq(schema.workflowCustomOrderMapping.customOrderId, customOrderId))
      .orderBy(schema.workflowCustomOrderMapping.id);

    const byItem = new Map<number, ImpactWorkflowMetrics>();
    for (const row of rows) {
      const itemId = Number(row.customOrderItemId);
      if (!Number.isInteger(itemId) || byItem.has(itemId)) continue;
      byItem.set(itemId, {
        id: Number(row.workflowId),
        avgArtisanWorkHoursPerMeter: numeric(row.avgArtisanWorkHoursPerMeter),
        avgWorkHoursPerProduct: numeric(row.avgWorkHoursPerProduct),
      });
    }
    return byItem;
  }

  /** Loom: customProductDAOController.retrieveEntity(id).getProductGroup(). */
  async findCustomProductGroup(customProductId: number, tx: Executor = this.db): Promise<string | null> {
    const rows = await tx
      .select({ productGroup: schema.customProduct.productGroup })
      .from(schema.customProduct)
      .where(eq(schema.customProduct.id, BigInt(customProductId)))
      .limit(1);
    return rows.length === 0 ? null : rows[0].productGroup;
  }

  /** Loom: repository.findByCustomOrderItemId — the existing row, or null. */
  async findImpactByOrderItem(orderItemId: number, tx: Executor = this.db): Promise<{ id: number; createdAt: number } | null> {
    const rows = await tx
      .select({ id: schema.customImpactFactor.id, createdAt: schema.customImpactFactor.createdAt })
      .from(schema.customImpactFactor)
      .where(eq(schema.customImpactFactor.customOrderItemId, orderItemId))
      .limit(1);
    if (rows.length === 0) return null;
    return { id: Number(rows[0].id), createdAt: Number(rows[0].createdAt) };
  }

  /** Loom: repository.delete on a swatch item's stale row. */
  async deleteImpactByOrderItem(orderItemId: number, tx: Executor = this.db): Promise<void> {
    await tx.delete(schema.customImpactFactor).where(eq(schema.customImpactFactor.customOrderItemId, orderItemId));
  }

  /**
   * Loom: repository.save(impact) — insert when absent, update in place when
   * present. `createdAt` is stamped once and never rewritten (Loom's
   * `if (impact.getCreatedAt() == null)`).
   */
  async saveImpact(
    existingId: number | null,
    row: {
      workflowId: number | null;
      tenantId: number;
      customOrderId: number;
      customOrderItemId: number;
      productType: ImpactProductType;
      metrics: ImpactMetrics;
      assumptions: ImpactAssumptions;
      now: number;
    },
    tx: Executor = this.db,
  ): Promise<void> {
    const { metrics } = row;
    // numeric columns are nullable and drizzle types them as string | null.
    const asNumeric = (value: number | null) => (value === null ? null : String(value));
    const values = {
      workflowId: row.workflowId,
      tenantId: row.tenantId,
      customOrderId: row.customOrderId,
      customOrderItemId: row.customOrderItemId,
      productType: row.productType,
      calculationStatus: metrics.calculationStatus,
      pendingReason: metrics.pendingReason,
      fabricMeters: asNumeric(metrics.fabricMeters),
      co2OffsetKg: asNumeric(metrics.co2OffsetKg),
      waterSavedLitres: asNumeric(metrics.waterSavedLitres),
      artisanHours: asNumeric(metrics.artisanHours),
      womenArtisanHours: asNumeric(metrics.womenArtisanHours),
      stitchingHours: asNumeric(metrics.stitchingHours),
      womenStitchingHours: asNumeric(metrics.womenStitchingHours),
      totalWorkHours: asNumeric(metrics.totalWorkHours),
      assumptionVersion: row.assumptions.assumptionVersion,
      assumptionSnapshot: row.assumptions,
      updatedAt: row.now,
    };

    if (existingId === null) {
      await tx.insert(schema.customImpactFactor).values({ ...values, createdAt: row.now });
      return;
    }
    await tx
      .update(schema.customImpactFactor)
      .set(values)
      .where(eq(schema.customImpactFactor.id, BigInt(existingId)));
  }

  /** Runs `work` inside one transaction, so a partial recalculation cannot commit. */
  async inTransaction<T>(work: (tx: Executor) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => work(tx));
  }
}
