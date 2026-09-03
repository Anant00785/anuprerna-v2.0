/**
 * Writes for POST /add/custom-workflow and PATCH /update/custom-workflow.
 *
 * Loom: `workflow/dao/controller/CustomWorkflowDAOController.addWorkflow` and
 * `.updateWorkflow`, plus the parts of
 * `workflow/service/ArtisanAssignmentService` those two call.
 *
 * Both writes run inside one transaction. Loom's `addWorkflow` cascades across
 * five tables (workflow, element, step_element, element, subprocess_element)
 * and then the mapping row, and only the mapping insert's result is returned:
 * a workflow without its custom-order mapping is invisible to every read in
 * this module, so a partial cascade must not commit.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq, inArray, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import type {
  AddCustomWorkflowInput,
  UpdateCustomWorkflowInput,
  WorkflowArtisanAssignmentInput,
  WorkflowStatus,
} from "../dto/custom-workflow.dto.js";

type Executor = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Loom: LoomUtility.adjustTimeStampByDays. */
export function adjustTimeStampByDays(timestamp: number, days: number): number {
  if (days === 0) return timestamp;
  return timestamp + days * 24 * 60 * 60 * 1000;
}

export interface StoredWorkflow {
  id: number;
  status: WorkflowStatus;
  tenantId: number;
  type: string;
}

function asNumeric(value: number | null): string | null {
  return value === null ? null : String(value);
}

@Injectable()
export class CustomWorkflowWriteRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async inTransaction<T>(work: (tx: Executor) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => work(tx));
  }

  /** Loom: templateDAOController.retrieveWorkflowTemplate — must exist. */
  async workflowTemplateExists(templateId: number, tx: Executor = this.db): Promise<boolean> {
    const rows = await tx
      .select({ id: schema.workflowTemplate.id })
      .from(schema.workflowTemplate)
      .where(eq(schema.workflowTemplate.id, BigInt(templateId)))
      .limit(1);
    return rows.length > 0;
  }

  /**
   * Loom: `addWorkflow` — the whole cascade, in Loom's order.
   *
   * The date propagation is Loom's exactly: `stepStartDate` and
   * `subProcessStartDate` are two INDEPENDENT accumulators, both seeded with
   * the workflow's estimatedStartDate, and each advances by its own element's
   * estimatedDays as the loop walks steps in order and sub-processes within
   * them. (The sub-process accumulator is NOT reset per step — that is what the
   * Java does, and reproducing it is the point.)
   *
   * @returns the new workflow id
   */
  async addCustomWorkflow(input: AddCustomWorkflowInput, tenantId: number, tx: Executor): Promise<number> {
    const now = Date.now();

    let stepStartDate = input.estimatedStartDate;
    let subProcessStartDate = input.estimatedStartDate;
    // Every step's end, so a body that omits estimatedEndDate still satisfies
    // the NOT NULL column with the schedule the cascade just computed rather
    // than with an invented value.
    let scheduleEnd = input.estimatedStartDate;

    const [workflowRow] = await tx
      .insert(schema.workflow)
      .values({
        workflowTemplateId: input.workflowTemplateId,
        name: input.name,
        description: input.description,
        tenantId,
        productId: null,
        // Loom: workflow.setStatus(WORKFLOW_STATUS.CREATED) — the body cannot
        // choose the initial status.
        status: "CREATED",
        estimatedStartDate: input.estimatedStartDate,
        estimatedEndDate: input.estimatedStartDate,
        createdAt: now,
        updatedAt: now,
        orderId: null,
        orderItemId: null,
        // Loom: workflow.setType(WORKFLOW_TYPE.CUSTOM_ORDER).
        type: "CUSTOM_ORDER",
        avgArtisanWorkHoursPerMeter: asNumeric(input.avgArtisanWorkHoursPerMeter),
        avgWorkHoursPerProduct: asNumeric(input.avgWorkHoursPerProduct),
        fabricUsedPerProductInMeters: asNumeric(input.fabricUsedPerProductInMeters),
        note: input.note,
      })
      .returning({ id: schema.workflow.id });

    const workflowId = Number(workflowRow.id);

    for (const step of input.steps) {
      const stepEnd = adjustTimeStampByDays(stepStartDate, step.estimatedDays);

      const [stepElementRow] = await tx
        .insert(schema.element)
        .values({
          workflowId,
          elementId: step.element.elementId,
          type: "STEP",
          posX: step.element.posX,
          posY: step.element.posY,
        })
        .returning({ id: schema.element.id });

      const [stepRow] = await tx
        .insert(schema.stepElement)
        .values({
          workflowId,
          elementId: Number(stepElementRow.id),
          parentStepId: step.parentStepId,
          previousStepId: step.previousStepId,
          nextStepId: step.nextStepId,
          primaryStep: step.primaryStep,
          estimatedDays: step.estimatedDays,
          estimatedStartDate: stepStartDate,
          estimatedEndDate: stepEnd,
          name: step.name,
          status: step.status,
          properties: step.properties as object,
          feedbackRequired: step.feedbackRequired,
        })
        .returning({ id: schema.stepElement.id });

      const stepId = Number(stepRow.id);
      stepStartDate = stepEnd;
      if (stepEnd > scheduleEnd) scheduleEnd = stepEnd;

      for (const subProcess of step.subProcesses) {
        const subEnd = adjustTimeStampByDays(subProcessStartDate, subProcess.estimatedDays);

        const [subElementRow] = await tx
          .insert(schema.element)
          .values({
            workflowId,
            elementId: subProcess.element.elementId,
            type: "SUBPROCESS",
            posX: subProcess.element.posX,
            posY: subProcess.element.posY,
          })
          .returning({ id: schema.element.id });

        await tx.insert(schema.subprocessElement).values({
          workflowId,
          stepId,
          elementId: Number(subElementRow.id),
          parentSubprocessId: subProcess.parentSubProcessId,
          previousSubprocessId: subProcess.previousSubProcessId,
          nextSubprocessId: subProcess.nextSubProcessId,
          primarySubprocess: subProcess.primarySubProcess,
          estimatedDays: subProcess.estimatedDays,
          estimatedStartDate: subProcessStartDate,
          estimatedEndDate: subEnd,
          name: subProcess.name,
          status: subProcess.status,
          properties: subProcess.properties as object,
          feedbackRequired: subProcess.feedbackRequired,
        });

        subProcessStartDate = subEnd;
        if (subEnd > scheduleEnd) scheduleEnd = subEnd;
      }
    }

    await tx
      .update(schema.workflow)
      .set({ estimatedEndDate: scheduleEnd })
      .where(eq(schema.workflow.id, BigInt(workflowId)));

    // Loom: the mapping is the LAST insert, and its result is what addWorkflow
    // returns. Without it the workflow is orphaned.
    await tx.insert(schema.workflowCustomOrderMapping).values({
      workflowId,
      customOrderId: input.referenceOrderId,
      customOrderItemId: input.referenceOrderItemId,
      custom: input.custom,
      productId: input.custom ? null : input.referenceProductId,
      customProductId: input.custom ? input.referenceProductId : null,
    });

    return workflowId;
  }

  /** Loom: `this.retrieveEntity(updatedWorkflow.getId())`. */
  async findWorkflow(workflowId: number, tx: Executor = this.db): Promise<StoredWorkflow | null> {
    const rows = await tx
      .select({
        id: schema.workflow.id,
        status: schema.workflow.status,
        tenantId: schema.workflow.tenantId,
        type: schema.workflow.type,
      })
      .from(schema.workflow)
      .where(eq(schema.workflow.id, BigInt(workflowId)))
      .limit(1);
    if (rows.length === 0) return null;
    return {
      id: Number(rows[0].id),
      status: rows[0].status as WorkflowStatus,
      tenantId: Number(rows[0].tenantId),
      type: rows[0].type,
    };
  }

  /**
   * Loom: WorkflowArtisanMappingJpaRepository.existsConflictingBasePay — true
   * when this artisan already holds a DIFFERENT base pay at another level of
   * the same workflow. The payment calculation needs one rate per artisan per
   * workflow, so the conflict is rejected at assignment time.
   *
   * `includeWorkflowLevel` is false here, matching Loom's call from
   * updateWorkflow: the workflow level is the level being replaced.
   */
  async existsConflictingBasePay(
    workflowId: number,
    artisanId: number,
    proposedRate: number,
    includeWorkflowLevel: boolean,
    tx: Executor = this.db,
  ): Promise<boolean> {
    const result = await tx.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM (
          SELECT wam.base_pay
            FROM workflow_artisan_mapping wam
            WHERE ${includeWorkflowLevel} = TRUE
              AND wam.workflow_id = ${workflowId}
              AND wam.artisan_id = ${artisanId}
              AND wam.base_pay IS NOT NULL
          UNION ALL
          SELECT seam.base_pay
            FROM step_element_artisan_mapping seam
            JOIN step_element se ON se.id = seam.step_element_id
            WHERE se.workflow_id = ${workflowId}
              AND seam.artisan_id = ${artisanId}
              AND seam.base_pay IS NOT NULL
          UNION ALL
          SELECT spam.base_pay
            FROM subprocess_element_artisan_mapping spam
            JOIN subprocess_element sp ON sp.id = spam.subprocess_element_id
            WHERE sp.workflow_id = ${workflowId}
              AND spam.artisan_id = ${artisanId}
              AND spam.base_pay IS NOT NULL
        ) other
        WHERE other.base_pay <> ${proposedRate}
      ) AS conflict
    `);
    const rows = (result as { rows?: unknown[] })?.rows ?? (result as unknown[]);
    const first = Array.isArray(rows) ? (rows[0] as Record<string, unknown> | undefined) : undefined;
    return first?.conflict === true;
  }

  /** The artisan ids that actually exist — Loom: retrieveArtisanMapForWrite. */
  async existingArtisanIds(artisanIds: number[], tx: Executor = this.db): Promise<Set<number>> {
    if (artisanIds.length === 0) return new Set();
    const rows = await tx
      .select({ id: schema.artisan.id })
      .from(schema.artisan)
      .where(inArray(schema.artisan.id, artisanIds.map((id) => BigInt(id))));
    return new Set(rows.map((row) => Number(row.id)));
  }

  /**
   * Loom: ArtisanAssignmentService.synchronizeWorkflowArtisanAssignments —
   * mappings for artisans not in the incoming list are removed, existing ones
   * are updated in place, and new ones are inserted only for artisans that
   * exist (Loom's `if (artisan == null) continue`).
   */
  async synchronizeArtisanAssignments(
    workflowId: number,
    assignments: WorkflowArtisanAssignmentInput[],
    tx: Executor,
  ): Promise<void> {
    const wanted = new Map(assignments.map((a) => [a.artisanId, a]));

    const existing = await tx
      .select({ id: schema.workflowArtisanMapping.id, artisanId: schema.workflowArtisanMapping.artisanId })
      .from(schema.workflowArtisanMapping)
      .where(eq(schema.workflowArtisanMapping.workflowId, workflowId));

    const staleIds = existing.filter((row) => !wanted.has(Number(row.artisanId))).map((row) => row.id);
    if (staleIds.length > 0) {
      await tx.delete(schema.workflowArtisanMapping).where(inArray(schema.workflowArtisanMapping.id, staleIds));
    }
    if (wanted.size === 0) return;

    const existingByArtisan = new Map(existing.map((row) => [Number(row.artisanId), row.id]));
    const missing = [...wanted.keys()].filter((id) => !existingByArtisan.has(id));
    const realArtisans = await this.existingArtisanIds(missing, tx);

    for (const [artisanId, assignment] of wanted) {
      const values = {
        quantityOfFabricInMeters: asNumeric(assignment.quantityOfFabricInMeters),
        quantityOfProducts: asNumeric(assignment.quantityOfProducts),
        basePay: asNumeric(assignment.basePay),
      };
      const mappingId = existingByArtisan.get(artisanId);
      if (mappingId !== undefined) {
        await tx
          .update(schema.workflowArtisanMapping)
          .set(values)
          .where(eq(schema.workflowArtisanMapping.id, mappingId));
        continue;
      }
      if (!realArtisans.has(artisanId)) continue;
      await tx.insert(schema.workflowArtisanMapping).values({ workflowId, artisanId, ...values });
    }
  }

  /**
   * Loom: `updateWorkflow`'s field copy — name, description, note, status and
   * the planning metrics, plus updatedAt.
   *
   * `applyWorkflowPlanningDetails`: a workflow is a FABRIC job or a FINISHED
   * job, and setting one side NULLS the other. A body carrying neither leaves
   * both untouched.
   */
  async applyWorkflowUpdate(
    workflowId: number,
    input: UpdateCustomWorkflowInput,
    nextStatus: WorkflowStatus,
    tx: Executor,
  ): Promise<void> {
    const hasFabricMetrics = input.avgArtisanWorkHoursPerMeter !== null;
    const hasFinishedMetrics =
      input.avgWorkHoursPerProduct !== null || input.fabricUsedPerProductInMeters !== null;

    const planning = hasFabricMetrics && !hasFinishedMetrics
      ? {
          avgArtisanWorkHoursPerMeter: asNumeric(input.avgArtisanWorkHoursPerMeter),
          avgWorkHoursPerProduct: null,
          fabricUsedPerProductInMeters: null,
        }
      : hasFinishedMetrics && !hasFabricMetrics
        ? {
            avgWorkHoursPerProduct: asNumeric(input.avgWorkHoursPerProduct),
            fabricUsedPerProductInMeters: asNumeric(input.fabricUsedPerProductInMeters),
            avgArtisanWorkHoursPerMeter: null,
          }
        : {};

    await tx
      .update(schema.workflow)
      .set({
        name: input.name,
        description: input.description,
        note: input.note,
        status: nextStatus,
        updatedAt: Date.now(),
        ...planning,
      })
      .where(eq(schema.workflow.id, BigInt(workflowId)));
  }

  /**
   * Loom: `publishCustomImpactRefresh` resolves the custom order behind a
   * workflow through its mapping. Returns null when the workflow has none,
   * which is also how a standard-order workflow is told apart from a custom one.
   */
  async findCustomOrderIdForWorkflow(workflowId: number, tx: Executor = this.db): Promise<number | null> {
    const rows = await tx
      .select({ customOrderId: schema.workflowCustomOrderMapping.customOrderId })
      .from(schema.workflowCustomOrderMapping)
      .where(eq(schema.workflowCustomOrderMapping.workflowId, workflowId))
      .limit(1);
    return rows.length === 0 ? null : Number(rows[0].customOrderId);
  }

  /** Does this custom order item belong to this custom order? */
  async customOrderItemBelongsToOrder(orderId: number, orderItemId: number, tx: Executor = this.db): Promise<boolean> {
    const rows = await tx
      .select({ id: schema.customOrderItem.id })
      .from(schema.customOrderItem)
      .where(and(eq(schema.customOrderItem.id, BigInt(orderItemId)), eq(schema.customOrderItem.customOrderId, orderId)))
      .limit(1);
    return rows.length > 0;
  }

  /** Loom: `findByIdAndTenantAndDeletedFalse` — the CODE_CU tenant scope. */
  async customOrderExistsForTenant(orderId: number, tenantId: number, tx: Executor = this.db): Promise<boolean> {
    const rows = await tx
      .select({ id: schema.customOrder.id })
      .from(schema.customOrder)
      .where(
        and(
          eq(schema.customOrder.id, BigInt(orderId)),
          eq(schema.customOrder.tenantId, tenantId),
          eq(schema.customOrder.deleted, false),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  /** Loom: artisanDAOController.retrieveArtisanByTenant. */
  async findArtisanIdByTenant(tenantId: number, tx: Executor = this.db): Promise<number | null> {
    const rows = await tx
      .select({ id: schema.artisan.id })
      .from(schema.artisan)
      .where(eq(schema.artisan.tenantId, tenantId))
      .limit(1);
    return rows.length === 0 ? null : Number(rows[0].id);
  }
}
