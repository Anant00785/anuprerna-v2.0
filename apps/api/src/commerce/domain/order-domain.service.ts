/**
 * apps/api/src/commerce/domain/order-domain.service.ts
 *
 * Service layer for the order-shaped routes in commerce/domain that were
 * previously inline Drizzle in the controller. Extracted because every method
 * here is either tenant-scoped (an IDOR if it is not) or was answering with
 * data that had nothing to do with the id it was asked about.
 *
 * Java originals:
 *   impact/controller/ImpactFactorController.getOrderImpact
 *   impact/dao/controller/ImpactFactorDAOController.retrieveOrderImpact
 *   workflow/controller/WorkflowController.retrieveOrderWiseWorkflowList
 *   order/controller/CustomOrderFulfillmentController.getCustomerCustomOrderFulfillmentList
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, sql } from "drizzle-orm";
import * as schema from "../../database/schema/schema.js";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { IMPACT_ASSUMPTIONS_ATTRIBUTE, IMPACT_ASSUMPTIONS_NOT_CONFIGURED } from "../impact/dto/impact-assumptions.js";
import {
  buildCustomOrderImpactSummary,
  emptyImpactSummary,
  toImpactAggregation,
  type ImpactAggregation,
  type ImpactSummary,
} from "../impact/dto/impact-summary.js";

/** drizzle/postgres-js hands `execute` back either an array or `{ rows }`. */
function resultRows(result: unknown): Record<string, unknown>[] {
  const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

@Injectable()
export class OrderDomainService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Loom: ImpactFactorDAOController.retrieveOrderImpact(orderId, tenantScope).
   *
   * `tenantScopeId` is null ONLY for a super user (Loom's
   * `superUser ? null : tenant`); for a customer it is that customer's own
   * tenant id off the JWT and is NEVER taken from the request.
   *
   * An order outside the caller's scope yields ImpactSummary.emptyOrder(id) —
   * Loom's own behaviour, and it leaks nothing: an out-of-scope id is
   * indistinguishable from an order with no impact rows.
   */
  async getOrderImpact(orderId: number, tenantScopeId: number | null): Promise<ImpactSummary> {
    if (!Number.isFinite(orderId) || orderId <= 0) return emptyImpactSummary(orderId);

    const orderWhere =
      tenantScopeId === null
        ? and(eq(schema.orders.id, BigInt(orderId)), eq(schema.orders.deleted, false))
        : and(
            eq(schema.orders.id, BigInt(orderId)),
            eq(schema.orders.deleted, false),
            eq(schema.orders.tenantId, tenantScopeId),
          );

    const order = await this.db.select({ id: schema.orders.id }).from(schema.orders).where(orderWhere).limit(1);
    if (order.length === 0) return emptyImpactSummary(orderId);

    const rows = await this.db
      .select()
      .from(schema.impactFactor)
      .where(eq(schema.impactFactor.orderId, orderId))
      .orderBy(asc(schema.impactFactor.id));

    // buildCustomOrderImpactSummary is the same roll-up Loom's buildOrderSummary
    // performs; it reads the item id off `customOrderItemId`, so the standard
    // rows are handed over under that name rather than duplicating the summer.
    const summary = buildCustomOrderImpactSummary(
      orderId,
      rows.map((row) => ({ ...row, customOrderItemId: row.orderItemId })),
    );

    const assumptions = await this.db
      .select({ value: schema.settings.attributeValue })
      .from(schema.settings)
      .where(eq(schema.settings.attributeName, IMPACT_ASSUMPTIONS_ATTRIBUTE))
      .limit(1);
    if (assumptions.length === 0) summary.configurationError = IMPACT_ASSUMPTIONS_NOT_CONFIGURED;

    return summary;
  }

  /**
   * Loom: ImpactFactorDAOController.retrieveImpactAggregation ->
   * ImpactFactorNativeQuery.RETRIEVE_IMPACT_AGGREGATION, ported verbatim.
   * CODE_SU: a deliberate cross-tenant total, so no tenant predicate.
   */
  async getOrderImpactAggregation(): Promise<ImpactAggregation> {
    const result = await this.db.execute(sql`
      SELECT
          COUNT(DISTINCT order_id)::bigint AS total_orders,
          COUNT(*)::bigint AS total_items,
          COALESCE(SUM(CASE WHEN calculation_status = 'COMPLETE' THEN 1 ELSE 0 END), 0)::bigint AS complete_items,
          COALESCE(SUM(CASE WHEN calculation_status = 'PARTIAL' THEN 1 ELSE 0 END), 0)::bigint AS partial_items,
          COALESCE(SUM(CASE WHEN product_type = 'FABRIC' THEN 1 ELSE 0 END), 0)::bigint AS fabric_items,
          COALESCE(SUM(CASE WHEN product_type = 'APPAREL' THEN 1 ELSE 0 END), 0)::bigint AS apparel_items,
          COALESCE(SUM(fabric_meters), 0)::double precision AS fabric_meters,
          COALESCE(SUM(co2_offset_kg), 0)::double precision AS co2_offset_kg,
          COALESCE(SUM(water_saved_litres), 0)::double precision AS water_saved_litres,
          COALESCE(SUM(artisan_hours), 0)::double precision AS artisan_hours,
          COALESCE(SUM(women_artisan_hours), 0)::double precision AS women_artisan_hours,
          COALESCE(SUM(stitching_hours), 0)::double precision AS stitching_hours,
          COALESCE(SUM(women_stitching_hours), 0)::double precision AS women_stitching_hours,
          COALESCE(SUM(total_work_hours), 0)::double precision AS total_work_hours
      FROM impact_factor
    `);
    return toImpactAggregation(resultRows(result)[0] ?? null);
  }

  /**
   * Loom: WorkflowDAOController.retrieveOrderWiseWorkflowList →
   * Workflow.java @NamedNativeQuery("findWorkflowSummariesByOrderId").
   * Ported verbatim; CODE_SU only, so no tenant predicate (Loom has none).
   */
  async getOrderWorkflowSummaries(orderId: number) {
    if (!Number.isFinite(orderId) || orderId <= 0) return [];

    const result = await this.db.execute(sql`
      SELECT
         w.id AS "workflowId",
         w.name AS "workflowName",
         p.sku AS "productSku",
         w.order_item_id AS "orderItemId",
         oi.order_status AS "orderItemStatus",
         oi.quantity AS "orderedQuantity",
         COALESCE((
             SELECT SUM(oir.quantity)
             FROM order_item_ready oir
             JOIN order_ready ore ON ore.id = oir.order_ready_id
             WHERE oir.order_item_id = oi.id
               AND ore.deleted = false
         ), 0) AS "readyQuantity",
         COALESCE((
             SELECT SUM(oif.quantity)
             FROM order_item_fulfillment oif
             JOIN order_fulfillment ofl ON ofl.id = oif.order_fulfillment_id
             WHERE oif.order_item_id = oi.id
               AND ofl.deleted = false
         ), 0) AS "fulfilledQuantity",
         CAST(oi.unit AS TEXT) AS "orderItemUnit",
         CAST(w.status AS TEXT) AS "status",
         w.note AS "note",
         CASE
          WHEN EXISTS (
              SELECT 1 FROM subprocess_element sp
              WHERE sp.workflow_id = w.id
                AND sp.estimated_start_date < EXTRACT(EPOCH FROM NOW()) * 1000
                AND sp.status = 'PENDING'
          )
          OR EXISTS (
              SELECT 1 FROM subprocess_element sp
              WHERE sp.workflow_id = w.id
                AND sp.estimated_end_date < EXTRACT(EPOCH FROM NOW()) * 1000
                AND sp.status = 'IN_PROGRESS'
          )
          OR (
               oi.estimated_delivery_from < EXTRACT(EPOCH FROM NOW()) * 1000
                   AND EXISTS (
                   SELECT 1 FROM subprocess_element sp
                   WHERE sp.workflow_id = w.id
                     AND sp.status IN ('PENDING', 'IN_PROGRESS')
               )
          ) THEN true
          ELSE false
          END AS "hasOverdueSubProcess",
          jsonb_agg(
              jsonb_build_object(
                'stepId', se.id,
                'stepName', se.name,
                'stepStatus', CAST(se.status AS TEXT),
                'stepEstimatedStartDate', se.estimated_start_date,
                'stepEstimatedEndDate', se.estimated_end_date,
                'stepActualStartDate', se.actual_start_date,
                'stepActualEndDate', se.actual_end_date,
                'stepElementId', (SELECT e.element_id FROM element e WHERE se.element_id = e.id),
                'previousStepElementId', se.previous_step_id,
                'nextStepElementId', se.next_step_id,
                'hasAssignedArtisan',
                CASE WHEN EXISTS (
                    SELECT 1 FROM step_element_artisan_mapping seam
                    WHERE seam.step_element_id = se.id
                ) THEN true ELSE false END,
                'subProcesses', (
                  SELECT jsonb_agg(
                      jsonb_build_object(
                        'subProcessId', sp.id,
                        'subProcessName', sp.name,
                        'subProcessStatus', CAST(sp.status AS TEXT),
                        'subProcessEstimatedStartDate', sp.estimated_start_date,
                        'subProcessEstimatedEndDate', sp.estimated_end_date,
                        'subProcessActualStartDate', sp.actual_start_date,
                        'subProcessActualEndDate', sp.actual_end_date,
                        'subProcessElementId', (SELECT e.element_id FROM element e WHERE sp.element_id = e.id),
                        'previousSubProcessElementId', sp.previous_subprocess_id,
                        'nextSubProcessElementId', sp.next_subprocess_id,
                        'hasAssignedArtisan',
                        CASE WHEN EXISTS (
                            SELECT 1 FROM subprocess_element_artisan_mapping spam
                            WHERE spam.subprocess_element_id = sp.id
                        ) THEN true ELSE false END,
                        'feedbackId',
                        COALESCE((
                            SELECT ef.id FROM element_feedback ef
                            WHERE ef.element_id = sp.element_id AND ef.status = 'APPROVED'
                            LIMIT 1
                        ), 0),
                        'hasApprovedFeedback',
                        CASE WHEN EXISTS (
                            SELECT 1 FROM element_feedback ef
                            WHERE ef.element_id = sp.element_id AND ef.status = 'APPROVED'
                        ) THEN true ELSE false END
                      )
                    )
                  FROM subprocess_element sp
                  WHERE sp.step_id = se.id
                )
              )
            ) AS "steps"
      FROM workflow w
      LEFT JOIN order_item oi ON w.order_item_id = oi.id
      LEFT JOIN step_element se ON w.id = se.workflow_id
      LEFT JOIN product p ON w.product_id = p.id
      WHERE w.type = 'ORDER' AND w.order_id = ${orderId}
      GROUP BY w.id, w.name, p.sku, w.order_item_id, oi.id, oi.order_status, oi.quantity, oi.unit,
               w.note, oi.estimated_delivery_from
    `);

    const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    return resultRows(result).map((r) => ({
      workflowId: num(r.workflowId),
      workflowName: (r.workflowName as string) ?? null,
      productSku: (r.productSku as string) ?? null,
      orderItemId: num(r.orderItemId),
      orderItemStatus: (r.orderItemStatus as string) ?? null,
      orderedQuantity: num(r.orderedQuantity),
      readyQuantity: num(r.readyQuantity),
      fulfilledQuantity: num(r.fulfilledQuantity),
      orderItemUnit: (r.orderItemUnit as string) ?? null,
      hasOverdueSubProcess: Boolean(r.hasOverdueSubProcess),
      status: (r.status as string) ?? null,
      note: (r.note as string) ?? null,
      steps: r.steps ?? [],
    }));
  }

  /**
   * Loom: CustomOrderFulfillmentDAOController.retrieveCustomOrderFulfillmentListByTenant
   * — the customer-facing read is scoped by the token's tenant, NOT by the
   * path id alone. Without the custom_order join this is an IDOR: any logged-in
   * customer could read any other customer's shipment/tracking rows by id.
   */
  async getCustomOrderFulfillmentsForTenant(customOrderId: number, tenantId: number) {
    if (!Number.isFinite(customOrderId) || customOrderId <= 0) return [];
    if (!Number.isFinite(tenantId) || tenantId <= 0) return [];

    const owned = await this.db
      .select({ id: schema.customOrder.id })
      .from(schema.customOrder)
      .where(
        and(
          eq(schema.customOrder.id, BigInt(customOrderId)),
          eq(schema.customOrder.tenantId, tenantId),
          eq(schema.customOrder.deleted, false),
        ),
      )
      .limit(1);
    if (owned.length === 0) return [];

    return this.db
      .select()
      .from(schema.customOrderFulfillment)
      .where(
        and(
          eq(schema.customOrderFulfillment.customOrderId, customOrderId),
          eq(schema.customOrderFulfillment.deleted, false),
        ),
      )
      .orderBy(asc(schema.customOrderFulfillment.id));
  }
}
