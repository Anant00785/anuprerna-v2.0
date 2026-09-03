import { BadRequestException, Injectable, Logger, NotImplementedException } from "@nestjs/common";
import {
  CustomWorkflowRepository,
  type OrderwiseWorkflow,
  type OrderwiseWorkflowStep,
  type OrderwiseWorkflowSubProcess,
} from "../repository/custom-workflow.repository.js";
import { CustomWorkflowWriteRepository } from "../repository/custom-workflow-write.repository.js";
import { CustomOrderImpactService } from "../../impact/service/custom-order-impact.service.js";
import type { AddCustomWorkflowInput, UpdateCustomWorkflowInput } from "../dto/custom-workflow.dto.js";
import { resolveStatusTransition } from "../dto/workflow-status.machine.js";

/** Loom: ActionCode outcomes, reduced to what the controller reports. */
export type UpdateOutcome = "UPDATED" | "NOT_FOUND" | "BASE_PAY_CONFLICT";

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

@Injectable()
export class CustomWorkflowService {
  private readonly logger = new Logger(CustomWorkflowService.name);

  constructor(
    private readonly repo: CustomWorkflowRepository,
    private readonly writeRepo: CustomWorkflowWriteRepository,
    private readonly impactService: CustomOrderImpactService,
  ) {}

  /** Loom: CustomWorkflowDAOController.retrieveWorkflowList — upper-cases the status. */
  getCustomWorkflowList(status: string) {
    return this.repo.findAllCustomWorkflows((status ?? "").toUpperCase());
  }

  /**
   * Loom: CustomWorkflowController.retrieveWorkflowListForArtisan — the artisan
   * is resolved from the TOKEN's tenant, never from a parameter. Loom returns an
   * empty list when the caller is not an artisan, which is what
   * `artisanDAOController.retrieveArtisanByTenant` returning null means.
   */
  async getArtisanCustomWorkflowList(tenantId: number, status: string) {
    const artisanId = await this.writeRepo.findArtisanIdByTenant(tenantId);
    if (artisanId === null) return [];
    return this.repo.findAllCustomWorkflowsByArtisan(artisanId, (status ?? "").toUpperCase());
  }

  /** Loom: CustomWorkflowDAOController.retrieveOrderWiseWorkflowList. */
  getCustomOrderWorkflowList(orderId: number) {
    return this.repo.findCustomWorkflowSummariesByOrderId(orderId);
  }

  /**
   * Loom: CustomWorkflowDAOController.getOrderwiseWorkflow.
   *
   * The order must belong to the calling tenant (`findByIdAndTenantAndDeletedFalse`)
   * — this is a CODE_CU route, so the scope comes from the JWT. An order outside
   * scope, or one with no rows, is null, which the controller renders as Loom's
   * empty entity rather than as a 404 existence oracle.
   */
  async getOrderwiseWorkflow(tenantId: number, orderId: number, orderItemId: number): Promise<OrderwiseWorkflow | null> {
    if (!(await this.writeRepo.customOrderExistsForTenant(orderId, tenantId))) return null;

    const rows = await this.repo.findOrderwiseCustomWorkflow(orderId, orderItemId);
    if (rows.length === 0) return null;

    const first = rows[0];
    const steps = new Map<number, OrderwiseWorkflowStep>();

    for (const row of rows) {
      const stepId = Number(row.stepId);
      let step = steps.get(stepId);
      if (step === undefined) {
        step = {
          stepId,
          stepName: str(row.stepName),
          stepStatus: str(row.stepStatus),
          stepEstimatedStartDate: num(row.stepEstimatedStartDate),
          stepEstimatedEndDate: num(row.stepEstimatedEndDate),
          stepActualStartDate: num(row.stepActualStartDate),
          stepActualEndDate: num(row.stepActualEndDate),
          stepElementId: str(row.stepElementId),
          previousStepElementId: str(row.previousStepElementId),
          nextStepElementId: str(row.nextStepElementId),
          subProcesses: [],
        };
        steps.set(stepId, step);
      }

      // The LEFT JOIN yields one all-null sub-process row for a step that has
      // none; Loom would build a sub-process of nulls, but an empty list is the
      // honest rendering of "this step has no sub-processes".
      if (row.subProcessId === null || row.subProcessId === undefined) continue;

      const subProcess: OrderwiseWorkflowSubProcess = {
        subProcessId: num(row.subProcessId),
        subProcessName: str(row.subProcessName),
        subProcessStatus: str(row.subProcessStatus),
        subProcessEstimatedStartDate: num(row.subProcessEstimatedStartDate),
        subProcessEstimatedEndDate: num(row.subProcessEstimatedEndDate),
        subProcessActualStartDate: num(row.subProcessActualStartDate),
        subProcessActualEndDate: num(row.subProcessActualEndDate),
        subProcessElementId: str(row.subProcessElementId),
        previousSubProcessElementId: str(row.previousSubProcessElementId),
        nextSubProcessElementId: str(row.nextSubProcessElementId),
        hasApprovedFeedback: Boolean(row.hasApprovedFeedback),
        feedbackId: num(row.feedbackId),
      };
      step.subProcesses.push(subProcess);
    }

    return {
      workflowId: num(first.workflowId),
      workflowName: str(first.workflowName),
      status: str(first.workflowStatus),
      steps: [...steps.values()],
    };
  }

  /**
   * Loom: CustomWorkflowDAOController.addWorkflow.
   *
   * The entire cascade — workflow, per-step element + step_element, per-sub-process
   * element + subprocess_element, and finally the custom-order mapping — commits
   * or rolls back as one unit. Loom returns the MAPPING's action code, so a
   * workflow whose mapping did not land is not a success; here a failure
   * anywhere aborts the transaction and nothing is written at all.
   *
   * After the commit Loom publishes a custom-order impact refresh
   * (`publishCustomImpactRefresh` -> `ImpactRefreshPublisherService`, which runs
   * in a REQUIRES_NEW transaction). That is reproduced by recalculating the
   * order's impact after the cascade commits — outside the write transaction,
   * and non-fatal, because the workflow is already durable by then.
   */
  async addCustomWorkflow(input: AddCustomWorkflowInput, tenantId: number): Promise<number> {
    const workflowId = await this.writeRepo.inTransaction(async (tx) => {
      if (!(await this.writeRepo.workflowTemplateExists(input.workflowTemplateId, tx))) {
        throw new BadRequestException(`workflowTemplateId ${input.workflowTemplateId} does not exist.`);
      }
      if (!(await this.writeRepo.customOrderItemBelongsToOrder(input.referenceOrderId, input.referenceOrderItemId, tx))) {
        throw new BadRequestException(
          `referenceOrderItemId ${input.referenceOrderItemId} does not belong to custom order ${input.referenceOrderId}.`,
        );
      }
      return this.writeRepo.addCustomWorkflow(input, tenantId, tx);
    });

    await this.refreshCustomOrderImpact(workflowId);
    return workflowId;
  }

  /**
   * Loom: CustomWorkflowDAOController.updateWorkflow.
   *
   * Order of operations is Loom's: read the existing row (absent -> NO_ACTION),
   * capture `previousStatus`, apply the field copy and the status transition,
   * reject a base-pay conflict BEFORE any write, synchronize the artisan
   * assignments, apply the planning details, then persist. All of it in one
   * transaction so a rejected assignment cannot leave a renamed workflow behind.
   *
   * NOT PORTED — and therefore refused rather than skipped: Loom's
   * `previousStatus != COMPLETED && status == COMPLETED` edge calls
   * `ArtisanPaymentRecordDAOController.calculateForWorkflow(id)`, which has no
   * counterpart in apps/api (`commerce/artisanpayment` has CRUD only). Letting
   * the transition through would complete a workflow and silently never pay the
   * artisans, so it throws with the missing engine named. Every other
   * transition is fully implemented. See docs/KNOWN-GAPS.md.
   */
  async updateCustomWorkflow(input: UpdateCustomWorkflowInput): Promise<UpdateOutcome> {
    const outcome = await this.writeRepo.inTransaction(async (tx): Promise<UpdateOutcome> => {
      const existing = await this.writeRepo.findWorkflow(input.id, tx);
      if (existing === null || existing.type !== "CUSTOM_ORDER") return "NOT_FOUND";

      const transition = resolveStatusTransition(existing.status, input.status);

      if (transition.entersCompleted) {
        throw new NotImplementedException(
          "Completing a custom workflow requires ArtisanPaymentRecordDAOController.calculateForWorkflow, which is not ported. " +
            "Loom recalculates every artisan's payment record on the transition into COMPLETED; accepting the transition here " +
            "would mark the work done and never pay for it. See docs/KNOWN-GAPS.md.",
        );
      }

      if (input.artisanAssignments !== null) {
        // Loom: hasConflictingBasePay(..., includeWorkflowLevel = false, null, null)
        // -> ActionCode.INCORRECT_INFORMATION, before anything is written.
        for (const assignment of input.artisanAssignments) {
          if (assignment.basePay === null) continue;
          const conflict = await this.writeRepo.existsConflictingBasePay(
            input.id,
            assignment.artisanId,
            assignment.basePay,
            false,
            tx,
          );
          if (conflict) return "BASE_PAY_CONFLICT";
        }
        await this.writeRepo.synchronizeArtisanAssignments(input.id, input.artisanAssignments, tx);
      }

      await this.writeRepo.applyWorkflowUpdate(input.id, input, transition.next, tx);
      return "UPDATED";
    });

    if (outcome === "UPDATED") await this.refreshCustomOrderImpact(input.id);
    return outcome;
  }

  /**
   * Loom: `publishCustomImpactRefresh` — a CUSTOM_ORDER workflow write changes
   * the inputs to that order's impact, so the impact rows are recalculated.
   * Loom does this in a separate REQUIRES_NEW transaction and does not fail the
   * write if it fails; the same applies here.
   */
  private async refreshCustomOrderImpact(workflowId: number): Promise<void> {
    const customOrderId = await this.writeRepo.findCustomOrderIdForWorkflow(workflowId);
    if (customOrderId === null) return;
    try {
      await this.impactService.calculateCustomOrderImpact(customOrderId, null);
    } catch (error) {
      // The workflow write is already committed. A refresh failure is logged,
      // not swallowed silently and not escalated into a false write failure —
      // the impact read reports its own staleness through configurationError.
      this.logger.error(
        `Impact refresh failed for custom order ${customOrderId} after a workflow write: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
