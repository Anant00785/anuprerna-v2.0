/**
 * The transition table from `CustomWorkflowDAOController.updateWorkflow`.
 * One test per legal transition, plus the refusals.
 */
import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { resolveStatusTransition } from "./workflow-status.machine.js";
import type { WorkflowStatus } from "./custom-workflow.dto.js";

const ALL: WorkflowStatus[] = ["CREATED", "INITIATED", "HALTED", "COMPLETED"];
const SETTABLE: WorkflowStatus[] = ["INITIATED", "HALTED", "COMPLETED"];

describe("legal transitions", () => {
  for (const from of ALL) {
    for (const to of SETTABLE) {
      it(`${from} -> ${to} is accepted and persists ${to}`, () => {
        const transition = resolveStatusTransition(from, to);
        expect(transition.next).toBe(to);
        expect(transition.changed).toBe(from !== to);
      });
    }
  }

  it("CREATED -> CREATED is the no-op the CMS sends when renaming a new job", () => {
    expect(resolveStatusTransition("CREATED", "CREATED")).toEqual({
      next: "CREATED",
      changed: false,
      entersCompleted: false,
    });
  });
});

describe("the COMPLETED edge", () => {
  it("flags entersCompleted only when the workflow was NOT already COMPLETED", () => {
    expect(resolveStatusTransition("INITIATED", "COMPLETED").entersCompleted).toBe(true);
    expect(resolveStatusTransition("CREATED", "COMPLETED").entersCompleted).toBe(true);
    expect(resolveStatusTransition("HALTED", "COMPLETED").entersCompleted).toBe(true);
    // Loom: previousStatus != COMPLETED — a re-save of a completed workflow must
    // not recalculate the artisan payments a second time.
    expect(resolveStatusTransition("COMPLETED", "COMPLETED").entersCompleted).toBe(false);
  });
});

describe("illegal transitions", () => {
  for (const from of ["INITIATED", "HALTED", "COMPLETED"] as WorkflowStatus[]) {
    it(`${from} -> CREATED is rejected, not silently ignored`, () => {
      expect(() => resolveStatusTransition(from, "CREATED")).toThrow(BadRequestException);
      expect(() => resolveStatusTransition(from, "CREATED")).toThrow(/cannot be restored by an update/);
    });
  }
});
