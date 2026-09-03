import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";

/** Loom: WorkflowPreview, via the customWorkflowPreviewMapping SqlResultSetMapping. */
export interface CustomWorkflowPreview {
  id: number;
  name: string | null;
  description: string | null;
  workflowType: string | null;
  orderId: number | null;
  orderCreatedAt: number | null;
  orderDeliveryDateFrom: number | null;
  orderDeliveryDateTo: number | null;
  productSku: string | null;
  productName: string | null;
  productImage: string | null;
  status: string | null;
  hasOverdueSubProcess: boolean;
  hasAssignedArtisan: boolean;
  hasStepLevelAssignment: boolean;
  hasSubProcessLevelAssignment: boolean;
  quantityOfFabricInMeters: number | null;
  quantityOfProducts: number | null;
  basePay: number | null;
  basePayAssigned: number | null;
  quantityType: string | null;
}

@Injectable()
export class CustomWorkflowRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /**
   * Direct port of Loom's `findAllCustomWorkflows` @NamedNativeQuery
   * (workflow/orm/Workflow.java). Rows are the CUSTOM-order workflows only —
   * the join through workflow_custom_order_mapping is what makes it custom.
   *
   * `status` is compared upper-cased, and the literal 'ALL' means no filter,
   * exactly as Loom's WHERE clause does.
   */
  async findAllCustomWorkflows(status: string): Promise<CustomWorkflowPreview[]> {
    const result = await this.db.execute(sql`
      SELECT
        w.id                          AS "id",
        w.name                        AS "name",
        w.description                 AS "description",
        w.type                        AS "workflowType",
        wcom.custom_order_id          AS "orderId",
        o.created_at                  AS "orderCreatedAt",
        oi.estimated_delivery_from    AS "orderDeliveryDateFrom",
        oi.estimated_delivery_to      AS "orderDeliveryDateTo",
        CASE WHEN wcom.custom THEN cp.sku        ELSE p.sku        END AS "productSku",
        CASE WHEN wcom.custom THEN cp.name       ELSE p.name       END AS "productName",
        CASE WHEN wcom.custom THEN cp.hero_image ELSE p.hero_image END AS "productImage",
        w.status                      AS "status",
        CASE WHEN EXISTS (
               SELECT 1 FROM subprocess_element se
               WHERE se.workflow_id = w.id
                 AND se.estimated_start_date < EXTRACT(EPOCH FROM NOW()) * 1000
                 AND se.status = 'PENDING'
             )
             OR EXISTS (
               SELECT 1 FROM subprocess_element se
               WHERE se.workflow_id = w.id
                 AND se.estimated_end_date < EXTRACT(EPOCH FROM NOW()) * 1000
                 AND se.status = 'IN_PROGRESS'
             )
             OR (
               oi.estimated_delivery_from < EXTRACT(EPOCH FROM NOW()) * 1000
               AND EXISTS (
                 SELECT 1 FROM subprocess_element se
                 WHERE se.workflow_id = w.id
                   AND se.status IN ('PENDING', 'IN_PROGRESS')
               )
             )
             THEN true ELSE false
        END                           AS "hasOverdueSubProcess",
        CASE WHEN EXISTS (
               SELECT 1 FROM workflow_artisan_mapping wam WHERE wam.workflow_id = w.id
             ) THEN true ELSE false
        END                           AS "hasAssignedArtisan",
        CASE WHEN EXISTS (
               SELECT 1 FROM step_element_artisan_mapping seam
               JOIN step_element se ON se.id = seam.step_element_id
               WHERE se.workflow_id = w.id
             ) THEN true ELSE false
        END                           AS "hasStepLevelAssignment",
        CASE WHEN EXISTS (
               SELECT 1 FROM subprocess_element_artisan_mapping spam
               JOIN subprocess_element sp ON sp.id = spam.subprocess_element_id
               WHERE sp.workflow_id = w.id
             ) THEN true ELSE false
        END                           AS "hasSubProcessLevelAssignment",
        CAST(NULL AS NUMERIC)         AS "quantityOfFabricInMeters",
        CAST(NULL AS NUMERIC)         AS "quantityOfProducts",
        CAST(NULL AS NUMERIC)         AS "basePay",
        CAST(NULL AS NUMERIC)         AS "basePayAssigned",
        CAST(NULL AS VARCHAR)         AS "quantityType"
      FROM workflow_custom_order_mapping wcom
        JOIN workflow w           ON wcom.workflow_id = w.id
        JOIN custom_order o       ON wcom.custom_order_id = o.id
        JOIN custom_order_item oi ON wcom.custom_order_item_id = oi.id
        LEFT JOIN product p       ON wcom.product_id = p.id
        LEFT JOIN custom_product cp ON wcom.custom_product_id = cp.id
      WHERE UPPER(${status}) = 'ALL' OR UPPER(CAST(w.status AS TEXT)) = UPPER(${status})
      ORDER BY oi.estimated_delivery_to
    `);
    const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
    return Array.isArray(rows) ? rows.map(toPreview) : [];
  }

  /**
   * Direct port of Loom's `findAllCustomWorkflowsByArtisan` @NamedNativeQuery
   * (workflow/orm/Workflow.java) — the CUSTOM-order workflows this artisan is
   * assigned to, at ANY level (workflow, step or sub-process).
   *
   * The LATERAL block is Loom's artisan ETA derivation, and the two recursive
   * CTEs are what order the steps and sub-processes so "the artisan's LAST
   * assigned element" can be picked: priority 1 = a sub-process the artisan is
   * on, 2 = a step they are on, 3/4 = any element of a workflow they hold at
   * workflow level, 5 = the order item's own delivery window as the fallback.
   * Reproduced verbatim rather than approximated — an approximation here shows
   * an artisan the wrong dates for their own work.
   */
  async findAllCustomWorkflowsByArtisan(artisanId: number, status: string): Promise<CustomWorkflowPreview[]> {
    const result = await this.db.execute(sql`
      SELECT
        w.id                          AS "id",
        w.name                        AS "name",
        w.description                 AS "description",
        w.type                        AS "workflowType",
        wcom.custom_order_id          AS "orderId",
        o.created_at                  AS "orderCreatedAt",
        COALESCE(artisan_eta.estimated_start_date, oi.estimated_delivery_from) AS "orderDeliveryDateFrom",
        COALESCE(artisan_eta.estimated_end_date, oi.estimated_delivery_to)     AS "orderDeliveryDateTo",
        CASE WHEN wcom.custom THEN cp.sku        ELSE p.sku        END AS "productSku",
        CASE WHEN wcom.custom THEN cp.name       ELSE p.name       END AS "productName",
        CASE WHEN wcom.custom THEN cp.hero_image ELSE p.hero_image END AS "productImage",
        w.status                      AS "status",
        CASE WHEN EXISTS (
               SELECT 1 FROM subprocess_element se
               WHERE se.workflow_id = w.id
                 AND se.estimated_start_date < EXTRACT(EPOCH FROM NOW()) * 1000
                 AND se.status = 'PENDING'
             )
             OR EXISTS (
               SELECT 1 FROM subprocess_element se
               WHERE se.workflow_id = w.id
                 AND se.estimated_end_date < EXTRACT(EPOCH FROM NOW()) * 1000
                 AND se.status = 'IN_PROGRESS'
             )
             OR (
               oi.estimated_delivery_from < EXTRACT(EPOCH FROM NOW()) * 1000
               AND EXISTS (
                 SELECT 1 FROM subprocess_element se
                 WHERE se.workflow_id = w.id AND se.status IN ('PENDING', 'IN_PROGRESS')
               )
             )
             THEN true ELSE false
        END                           AS "hasOverdueSubProcess",
        CASE WHEN EXISTS (
               SELECT 1 FROM workflow_artisan_mapping wam
               WHERE wam.workflow_id = w.id AND wam.artisan_id = ${artisanId}
             ) THEN true ELSE false
        END                           AS "hasAssignedArtisan",
        CASE WHEN EXISTS (
               SELECT 1 FROM step_element_artisan_mapping seam
               JOIN step_element se ON se.id = seam.step_element_id
               WHERE se.workflow_id = w.id AND seam.artisan_id = ${artisanId}
             ) THEN true ELSE false
        END                           AS "hasStepLevelAssignment",
        CASE WHEN EXISTS (
               SELECT 1 FROM subprocess_element_artisan_mapping spam
               JOIN subprocess_element sp ON sp.id = spam.subprocess_element_id
               WHERE sp.workflow_id = w.id AND spam.artisan_id = ${artisanId}
             ) THEN true ELSE false
        END                           AS "hasSubProcessLevelAssignment",
        wam_assigned.quantity_of_fabric_in_meters AS "quantityOfFabricInMeters",
        wam_assigned.quantity_of_products         AS "quantityOfProducts",
        wam_assigned.base_pay                     AS "basePay",
        COALESCE(
          CASE
            WHEN lower(COALESCE(cp.product_group, oi.product_group)) = 'finished'
              THEN wam_assigned.quantity_of_products
            ELSE wam_assigned.quantity_of_fabric_in_meters
          END, 0
        ) * wam_assigned.base_pay AS "basePayAssigned",
        CASE
          WHEN lower(COALESCE(cp.product_group, oi.product_group)) = 'finished' THEN 'UNIT'
          ELSE 'METER'
        END AS "quantityType"
      FROM (
          SELECT wam.workflow_id
          FROM workflow_artisan_mapping wam
          JOIN workflow assigned_workflow ON assigned_workflow.id = wam.workflow_id
          WHERE wam.artisan_id = ${artisanId}
            AND assigned_workflow.type = 'CUSTOM_ORDER'
            AND (UPPER(${status}) = 'ALL' OR UPPER(CAST(assigned_workflow.status AS TEXT)) = UPPER(${status}))
          UNION
          SELECT se.workflow_id
          FROM step_element_artisan_mapping seam
          JOIN step_element se ON se.id = seam.step_element_id
          JOIN workflow assigned_workflow ON assigned_workflow.id = se.workflow_id
          WHERE seam.artisan_id = ${artisanId}
            AND assigned_workflow.type = 'CUSTOM_ORDER'
            AND (UPPER(${status}) = 'ALL' OR UPPER(CAST(assigned_workflow.status AS TEXT)) = UPPER(${status}))
          UNION
          SELECT sp.workflow_id
          FROM subprocess_element_artisan_mapping spam
          JOIN subprocess_element sp ON sp.id = spam.subprocess_element_id
          JOIN workflow assigned_workflow ON assigned_workflow.id = sp.workflow_id
          WHERE spam.artisan_id = ${artisanId}
            AND assigned_workflow.type = 'CUSTOM_ORDER'
            AND (UPPER(${status}) = 'ALL' OR UPPER(CAST(assigned_workflow.status AS TEXT)) = UPPER(${status}))
      ) assigned_workflow_ids
        JOIN workflow w ON assigned_workflow_ids.workflow_id = w.id
        JOIN workflow_custom_order_mapping wcom ON wcom.workflow_id = w.id
        LEFT JOIN workflow_artisan_mapping wam_assigned
               ON wam_assigned.workflow_id = w.id AND wam_assigned.artisan_id = ${artisanId}
        JOIN custom_order o ON wcom.custom_order_id = o.id
        JOIN custom_order_item oi ON wcom.custom_order_item_id = oi.id
        LEFT JOIN product p ON wcom.product_id = p.id
        LEFT JOIN custom_product cp ON wcom.custom_product_id = cp.id
        LEFT JOIN LATERAL (
          WITH RECURSIVE ordered_steps AS (
            SELECT se.id, 1 AS step_position
            FROM step_element se
            WHERE se.workflow_id = w.id AND se.primary_step = true
            UNION ALL
            SELECT se_next.id, ordered_steps.step_position + 1
            FROM ordered_steps
            JOIN step_element se_current ON se_current.id = ordered_steps.id
            JOIN element e_next ON e_next.element_id = se_current.next_step_id
            JOIN step_element se_next ON se_next.element_id = e_next.id
            WHERE se_next.workflow_id = w.id
          ),
          ordered_subprocesses AS (
            SELECT sp.id, sp.step_id, 1 AS subprocess_position
            FROM subprocess_element sp
            WHERE sp.workflow_id = w.id AND sp.primary_subprocess = true
            UNION ALL
            SELECT sp_next.id, ordered_subprocesses.step_id, ordered_subprocesses.subprocess_position + 1
            FROM ordered_subprocesses
            JOIN subprocess_element sp_current ON sp_current.id = ordered_subprocesses.id
            JOIN element e_next ON e_next.element_id = sp_current.next_subprocess_id
            JOIN subprocess_element sp_next ON sp_next.element_id = e_next.id
            WHERE sp_next.step_id = ordered_subprocesses.step_id
          )
          SELECT derived_eta.estimated_start_date, derived_eta.estimated_end_date
          FROM (
            SELECT sp.estimated_start_date, sp.estimated_end_date, 1 AS priority,
                   os.step_position, osp.subprocess_position, sp.id AS sort_id
            FROM subprocess_element_artisan_mapping spam
            JOIN subprocess_element sp ON sp.id = spam.subprocess_element_id
            LEFT JOIN ordered_steps os ON os.id = sp.step_id
            LEFT JOIN ordered_subprocesses osp ON osp.id = sp.id
            WHERE spam.artisan_id = ${artisanId} AND sp.workflow_id = w.id
            UNION ALL
            SELECT se.estimated_start_date, se.estimated_end_date, 2 AS priority,
                   os.step_position, CAST(NULL AS INTEGER), se.id
            FROM step_element_artisan_mapping seam
            JOIN step_element se ON se.id = seam.step_element_id
            LEFT JOIN ordered_steps os ON os.id = se.id
            WHERE seam.artisan_id = ${artisanId} AND se.workflow_id = w.id
            UNION ALL
            SELECT sp.estimated_start_date, sp.estimated_end_date, 3 AS priority,
                   os.step_position, osp.subprocess_position, sp.id
            FROM subprocess_element sp
            JOIN ordered_steps os ON os.id = sp.step_id
            LEFT JOIN ordered_subprocesses osp ON osp.id = sp.id
            WHERE wam_assigned.id IS NOT NULL AND sp.workflow_id = w.id
            UNION ALL
            SELECT se.estimated_start_date, se.estimated_end_date, 4 AS priority,
                   os.step_position, CAST(NULL AS INTEGER), se.id
            FROM step_element se
            JOIN ordered_steps os ON os.id = se.id
            WHERE wam_assigned.id IS NOT NULL AND se.workflow_id = w.id
            UNION ALL
            SELECT oi.estimated_delivery_from, oi.estimated_delivery_to, 5 AS priority,
                   CAST(NULL AS INTEGER), CAST(NULL AS INTEGER), w.id
          ) derived_eta
          ORDER BY derived_eta.priority,
                   derived_eta.step_position DESC NULLS LAST,
                   derived_eta.subprocess_position DESC NULLS LAST,
                   derived_eta.sort_id DESC
          LIMIT 1
        ) artisan_eta ON true
      ORDER BY COALESCE(artisan_eta.estimated_end_date, oi.estimated_delivery_to)
    `);
    const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
    return Array.isArray(rows) ? rows.map(toPreview) : [];
  }

  /**
   * Direct port of Loom's `findCustomWorkflowSummariesByOrderId`
   * @NamedNativeQuery (workflow/orm/WorkflowCustomOrderMapping.java) — one row
   * per workflow on the order, with its whole step tree aggregated into `steps`
   * as jsonb.
   */
  async findCustomWorkflowSummariesByOrderId(orderId: number): Promise<CustomWorkflowSummary[]> {
    const result = await this.db.execute(sql`
      SELECT
        w.id AS "workflowId",
        w.name AS "workflowName",
        CASE WHEN wcom.custom = true THEN cp.sku ELSE p.sku END AS "productSku",
        wcom.custom_order_item_id AS "orderItemId",
        oi.order_status AS "orderItemStatus",
        oi.quantity AS "orderedQuantity",
        COALESCE((
          SELECT SUM(coir.quantity)
          FROM custom_order_item_ready coir
          JOIN custom_order_ready core ON core.id = coir.custom_order_ready_id
          WHERE coir.custom_order_item_id = oi.id AND core.deleted = false
        ), 0) AS "readyQuantity",
        COALESCE((
          SELECT SUM(coif.quantity)
          FROM custom_order_item_fulfillment coif
          JOIN custom_order_fulfillment cofl ON cofl.id = coif.custom_order_fulfillment_id
          WHERE coif.custom_order_item_id = oi.id AND cofl.deleted = false
        ), 0) AS "fulfilledQuantity",
        CAST(oi.unit AS TEXT) AS "orderItemUnit",
        CAST(w.status AS workflow_status_enum) AS "status",
        w.note AS "workflowNote",
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
              WHERE sp.workflow_id = w.id AND sp.status IN ('PENDING', 'IN_PROGRESS')
            )
          ) THEN true ELSE false
        END AS "hasOverdueSubProcess",
        jsonb_agg(
          jsonb_build_object(
            'stepId', se.id,
            'stepName', se.name,
            'stepStatus', CAST(se.status AS element_status_enum),
            'stepEstimatedStartDate', se.estimated_start_date,
            'stepEstimatedEndDate', se.estimated_end_date,
            'stepActualStartDate', se.actual_start_date,
            'stepActualEndDate', se.actual_end_date,
            'stepElementId', (SELECT e.element_id FROM element e WHERE se.element_id = e.id),
            'previousStepElementId', se.previous_step_id,
            'nextStepElementId', se.next_step_id,
            'hasAssignedArtisan',
              CASE WHEN EXISTS (
                SELECT 1 FROM step_element_artisan_mapping seam WHERE seam.step_element_id = se.id
              ) THEN true ELSE false END,
            'subProcesses', (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'subProcessId', sp.id,
                  'subProcessName', sp.name,
                  'subProcessStatus', CAST(sp.status AS element_status_enum),
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
                    CASE WHEN EXISTS (
                      SELECT 1 FROM element_feedback ef
                      WHERE ef.element_id = sp.element_id AND ef.status = 'APPROVED'
                    ) THEN (
                      SELECT ef.id FROM element_feedback ef
                      WHERE ef.element_id = sp.element_id AND ef.status = 'APPROVED' LIMIT 1
                    ) ELSE 0 END,
                  'hasApprovedFeedback',
                    CASE WHEN EXISTS (
                      SELECT 1 FROM element_feedback ef
                      WHERE ef.element_id = sp.element_id AND ef.status = 'APPROVED'
                    ) THEN true ELSE false END
                )
              )
              FROM subprocess_element sp WHERE sp.step_id = se.id
            )
          )
        ) AS "steps"
      FROM workflow_custom_order_mapping wcom
      JOIN workflow w ON wcom.workflow_id = w.id
      LEFT JOIN custom_order_item oi ON wcom.custom_order_item_id = oi.id
      LEFT JOIN step_element se ON w.id = se.workflow_id
      LEFT JOIN product p ON wcom.product_id = p.id
      LEFT JOIN custom_product cp ON wcom.custom_product_id = cp.id
      WHERE w.type = 'CUSTOM_ORDER' AND wcom.custom_order_id = ${orderId}
      GROUP BY w.id, w.name, wcom.custom, wcom.custom_order_id, oi.id, oi.order_status,
               oi.quantity, oi.unit, w.note, cp.sku, p.sku, wcom.custom_order_item_id,
               oi.estimated_delivery_from
    `);
    const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
    return Array.isArray(rows) ? rows.map(toSummary) : [];
  }

  /**
   * Direct port of Loom's `findOrderwiseCustomWorkflow` @NamedNativeQuery — a
   * flat step x sub-process product that the service folds back into a tree,
   * exactly as `CustomWorkflowDAOController.getOrderwiseWorkflow` does.
   */
  async findOrderwiseCustomWorkflow(orderId: number, orderItemId: number): Promise<Record<string, unknown>[]> {
    const result = await this.db.execute(sql`
      SELECT
        w.id AS "workflowId",
        w.name AS "workflowName",
        CAST(w.status AS workflow_status_enum) AS "workflowStatus",
        se.id AS "stepId",
        se.name AS "stepName",
        CAST(se.status AS element_status_enum) AS "stepStatus",
        se.estimated_start_date AS "stepEstimatedStartDate",
        se.estimated_end_date AS "stepEstimatedEndDate",
        se.actual_start_date AS "stepActualStartDate",
        se.actual_end_date AS "stepActualEndDate",
        (SELECT e.element_id FROM element e WHERE se.element_id = e.id) AS "stepElementId",
        se.previous_step_id AS "previousStepElementId",
        se.next_step_id AS "nextStepElementId",
        sp.id AS "subProcessId",
        sp.name AS "subProcessName",
        CAST(sp.status AS element_status_enum) AS "subProcessStatus",
        sp.estimated_start_date AS "subProcessEstimatedStartDate",
        sp.estimated_end_date AS "subProcessEstimatedEndDate",
        sp.actual_start_date AS "subProcessActualStartDate",
        sp.actual_end_date AS "subProcessActualEndDate",
        (SELECT e.element_id FROM element e WHERE sp.element_id = e.id) AS "subProcessElementId",
        sp.previous_subprocess_id AS "previousSubProcessElementId",
        sp.next_subprocess_id AS "nextSubProcessElementId",
        CASE WHEN EXISTS (
          SELECT 1 FROM element_feedback ef
          WHERE ef.element_id = sp.element_id AND ef.status = 'APPROVED'
        ) THEN (
          SELECT ef.id FROM element_feedback ef
          WHERE ef.element_id = sp.element_id AND ef.status = 'APPROVED' LIMIT 1
        ) ELSE 0 END AS "feedbackId",
        CASE WHEN EXISTS (
          SELECT 1 FROM element_feedback ef
          WHERE ef.element_id = sp.element_id AND ef.status = 'APPROVED'
        ) THEN true ELSE false END AS "hasApprovedFeedback"
      FROM workflow_custom_order_mapping wcom
      JOIN workflow w ON wcom.workflow_id = w.id
      JOIN step_element se ON se.workflow_id = w.id
      LEFT JOIN subprocess_element sp ON sp.step_id = se.id
      WHERE wcom.custom_order_id = ${orderId} AND wcom.custom_order_item_id = ${orderItemId}
    `);
    const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
    return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
  }
}

/** pg returns bigint/numeric as strings; Loom's mapping types them as numbers. */
function toPreview(raw: unknown): CustomWorkflowPreview {
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
  return {
    id: Number(r.id),
    name: str(r.name),
    description: str(r.description),
    workflowType: str(r.workflowType),
    orderId: num(r.orderId),
    orderCreatedAt: num(r.orderCreatedAt),
    orderDeliveryDateFrom: num(r.orderDeliveryDateFrom),
    orderDeliveryDateTo: num(r.orderDeliveryDateTo),
    productSku: str(r.productSku),
    productName: str(r.productName),
    productImage: str(r.productImage),
    status: str(r.status),
    hasOverdueSubProcess: Boolean(r.hasOverdueSubProcess),
    hasAssignedArtisan: Boolean(r.hasAssignedArtisan),
    hasStepLevelAssignment: Boolean(r.hasStepLevelAssignment),
    hasSubProcessLevelAssignment: Boolean(r.hasSubProcessLevelAssignment),
    quantityOfFabricInMeters: num(r.quantityOfFabricInMeters),
    quantityOfProducts: num(r.quantityOfProducts),
    basePay: num(r.basePay),
    basePayAssigned: num(r.basePayAssigned),
    quantityType: str(r.quantityType),
  };
}

/** Loom: workflow/pojo/WorkflowSummary. `steps` is the jsonb_agg block. */
export interface CustomWorkflowSummary {
  workflowId: number;
  workflowName: string | null;
  productSku: string | null;
  orderItemId: number | null;
  orderItemStatus: string | null;
  orderedQuantity: number | null;
  readyQuantity: number | null;
  fulfilledQuantity: number | null;
  orderItemUnit: string | null;
  hasOverdueSubProcess: boolean;
  status: string | null;
  workflowNote: string | null;
  steps: unknown;
}

/** Loom: workflow/pojo/OrderwiseWorkflowSubProcess. */
export interface OrderwiseWorkflowSubProcess {
  subProcessId: number | null;
  subProcessName: string | null;
  subProcessStatus: string | null;
  subProcessEstimatedStartDate: number | null;
  subProcessEstimatedEndDate: number | null;
  subProcessActualStartDate: number | null;
  subProcessActualEndDate: number | null;
  subProcessElementId: string | null;
  previousSubProcessElementId: string | null;
  nextSubProcessElementId: string | null;
  hasApprovedFeedback: boolean;
  feedbackId: number | null;
}

/** Loom: workflow/pojo/OrderwiseWorkflowStep. */
export interface OrderwiseWorkflowStep {
  stepId: number | null;
  stepName: string | null;
  stepStatus: string | null;
  stepEstimatedStartDate: number | null;
  stepEstimatedEndDate: number | null;
  stepActualStartDate: number | null;
  stepActualEndDate: number | null;
  stepElementId: string | null;
  previousStepElementId: string | null;
  nextStepElementId: string | null;
  subProcesses: OrderwiseWorkflowSubProcess[];
}

/** Loom: workflow/pojo/OrderwiseWorkflow. */
export interface OrderwiseWorkflow {
  workflowId: number | null;
  workflowName: string | null;
  status: string | null;
  steps: OrderwiseWorkflowStep[];
}

/** pg returns bigint/numeric as strings; Loom's WorkflowSummary types them as numbers. */
function toSummary(raw: unknown): CustomWorkflowSummary {
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
  return {
    workflowId: Number(r.workflowId),
    workflowName: str(r.workflowName),
    productSku: str(r.productSku),
    orderItemId: num(r.orderItemId),
    orderItemStatus: str(r.orderItemStatus),
    orderedQuantity: num(r.orderedQuantity),
    readyQuantity: num(r.readyQuantity),
    fulfilledQuantity: num(r.fulfilledQuantity),
    orderItemUnit: str(r.orderItemUnit),
    hasOverdueSubProcess: Boolean(r.hasOverdueSubProcess),
    status: str(r.status),
    workflowNote: str(r.workflowNote),
    // jsonb_agg over a LEFT JOIN yields [null] for a workflow with no steps.
    steps: Array.isArray(r.steps) ? r.steps.filter((step) => step !== null) : [],
  };
}
