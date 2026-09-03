/**
 * The custom-workflow status state machine.
 *
 * Loom source: `CustomWorkflowDAOController.updateWorkflow`, three lines —
 *
 *     WORKFLOW_STATUS previousStatus = existingWorkflow.getStatus();
 *     ...
 *     if (updatedWorkflow.getStatus() != null && updatedWorkflow.getStatus() != WORKFLOW_STATUS.CREATED) {
 *         existingWorkflow.setStatus(updatedWorkflow.getStatus());
 *     }
 *     ...
 *     if (previousStatus != WORKFLOW_STATUS.COMPLETED && existingWorkflow.getStatus() == WORKFLOW_STATUS.COMPLETED) {
 *         this.artisanPaymentRecordDAOController.calculateForWorkflow(existingWorkflow.getId());
 *     }
 *
 * plus `WorkflowUpdateRequestValidator.isTypeValid`, which 400s a null or
 * unknown status before the DAO is reached, and
 * `CustomWorkflowDAOController.addWorkflow`, which stamps CREATED on insert
 * regardless of what the body said.
 *
 * So the transitions Loom actually permits are:
 *
 *              | INITIATED | HALTED | COMPLETED | CREATED
 *   CREATED    |     y     |    y   |     y     |  no-op
 *   INITIATED  |     y     |    y   |     y     |  refused
 *   HALTED     |     y     |    y   |     y     |  refused
 *   COMPLETED  |     y     |    y   |     y     |  refused
 *
 * CREATED is entered exactly once, by `addWorkflow`. It is not a reachable
 * target of an update: Loom's DAO drops it on the floor. Dropping it silently
 * is the failure mode this port refuses — a caller that asks to move a running
 * workflow back to CREATED gets a 400 naming the refusal, rather than a 200
 * that did nothing. Sending CREATED for a workflow that is ALREADY CREATED is
 * the common no-op (the CMS PATCHes the whole object back to rename a new job),
 * and is accepted unchanged.
 *
 * Loom permits every other pair, COMPLETED -> INITIATED included: a job can be
 * re-opened. That is deliberate in the source and is preserved here.
 */
import { BadRequestException } from "@nestjs/common";
import type { WorkflowStatus } from "./custom-workflow.dto.js";

/** The statuses an update may move a workflow TO. */
const SETTABLE: readonly WorkflowStatus[] = ["INITIATED", "HALTED", "COMPLETED"];

export interface StatusTransition {
  /** The status to persist. */
  next: WorkflowStatus;
  /** Whether the row's status actually changes. */
  changed: boolean;
  /**
   * Loom: `previousStatus != COMPLETED && next == COMPLETED` — the edge that
   * triggers ArtisanPaymentRecordDAOController.calculateForWorkflow.
   */
  entersCompleted: boolean;
}

/**
 * Resolves the status an update should persist, or throws for a transition Loom
 * cannot perform.
 *
 * @param current the status on the stored row
 * @param requested the status on the request body (already known to be a valid
 *                  WORKFLOW_STATUS — `parseUpdateCustomWorkflow` 400s otherwise)
 */
export function resolveStatusTransition(current: WorkflowStatus, requested: WorkflowStatus): StatusTransition {
  if (requested === "CREATED") {
    if (current === "CREATED") {
      return { next: "CREATED", changed: false, entersCompleted: false };
    }
    throw new BadRequestException(
      `Illegal workflow status transition ${current} -> CREATED. CREATED is set once, when the workflow is created, and cannot be restored by an update.`,
    );
  }

  if (!SETTABLE.includes(requested)) {
    // Unreachable through the DTO, kept so a future status added to the enum
    // fails loudly here instead of being written unchecked.
    throw new BadRequestException(`Illegal workflow status transition ${current} -> ${requested}.`);
  }

  return {
    next: requested,
    changed: current !== requested,
    entersCompleted: current !== "COMPLETED" && requested === "COMPLETED",
  };
}
