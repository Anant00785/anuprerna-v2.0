/**
 * Response-envelope tests for CustomWorkflowController.
 *
 * The keys are Loom's ResponseParameter values and are read verbatim by
 * apps/cms/src/lib/artisanflow-api.ts (pickArray(j, "workflowList")):
 *   WORKFLOW_LIST = "workflowList", WORKFLOW = "workflow".
 * Loom's postEntity envelope is {success, message}.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { CustomWorkflowController } from "./custom-workflow.controller.js";
import type { CustomWorkflowService } from "../service/custom-workflow.service.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";

const tenant = (id = 42) =>
  ({ id, uid: `u${id}`, email: "a@b.com", roles: ["ROLE_SUPER_USER"] }) as unknown as AuthenticatedTenant;

function make(over: Record<string, unknown> = {}) {
  const service = {
    getCustomWorkflowDetail: vi.fn().mockResolvedValue(null),
    getCustomWorkflowList: vi.fn().mockResolvedValue([]),
    getArtisanCustomWorkflowList: vi.fn().mockResolvedValue([]),
    getCustomOrderWorkflowList: vi.fn().mockResolvedValue([]),
    getOrderwiseWorkflow: vi.fn().mockResolvedValue(null),
    addCustomWorkflow: vi.fn().mockResolvedValue(501),
    updateCustomWorkflow: vi.fn().mockResolvedValue("UPDATED"),
    ...over,
  };
  return { service, controller: new CustomWorkflowController(service as unknown as CustomWorkflowService) };
}

const validAddBody = {
  name: "Weaving",
  description: "Handloom run",
  workflowTemplateId: 3,
  estimatedStartDate: 1_700_000_000_000,
  referenceOrderId: 300,
  referenceOrderItemId: 400,
  referenceProductId: 12,
  custom: true,
  status: "CREATED",
  steps: [
    {
      name: "Dyeing",
      estimatedDays: 2,
      status: "PENDING",
      primaryStep: true,
      element: { elementId: "a-b-c-d", type: "STEP", posX: 0, posY: 0 },
      subProcesses: [],
    },
  ],
};

describe("GET /get/custom-workflow/:workflowId", () => {
  it("returns the detail under Loom's `workflow` key (ResponseParameter.WORKFLOW)", async () => {
    const workflow = { id: 7, name: "Weaving", steps: [], artisanAssignments: [{ artisanId: 55 }] };
    const { controller, service } = make({ getCustomWorkflowDetail: vi.fn().mockResolvedValue(workflow) });

    await expect(controller.getCustomWorkflow("7")).resolves.toEqual({
      success: true,
      message: "",
      workflow,
    });
    expect(service.getCustomWorkflowDetail).toHaveBeenCalledWith(7);
  });

  it("renders a missing / non-custom workflow as a null payload, as Loom's empty entity does", async () => {
    const { controller } = make();
    await expect(controller.getCustomWorkflow("7")).resolves.toEqual({
      success: true,
      message: "",
      workflow: null,
    });
  });

  it("rejects a non-numeric workflowId instead of querying with NaN", async () => {
    const { controller, service } = make();
    await expect(controller.getCustomWorkflow("abc")).rejects.toThrow(BadRequestException);
    expect(service.getCustomWorkflowDetail).not.toHaveBeenCalled();
  });

  it("rejects a non-positive workflowId", async () => {
    const { controller, service } = make();
    await expect(controller.getCustomWorkflow("0")).rejects.toThrow(BadRequestException);
    expect(service.getCustomWorkflowDetail).not.toHaveBeenCalled();
  });
});

describe("GET /get/custom-workflow-list/:status", () => {
  it("returns previews under Loom's `workflowList` key", async () => {
    const rows = [{ id: 1, name: "Weaving", status: "IN_PROGRESS", workflowType: "CUSTOM_ORDER" }];
    const { controller } = make({ getCustomWorkflowList: vi.fn().mockResolvedValue(rows) });

    await expect(controller.getCustomWorkflowList("IN_PROGRESS")).resolves.toEqual({
      success: true,
      message: "",
      workflowList: rows,
    });
  });

  it("returns an empty workflowList when no workflow matches the status", async () => {
    const { controller } = make();
    await expect(controller.getCustomWorkflowList("COMPLETED")).resolves.toEqual({
      success: true,
      message: "",
      workflowList: [],
    });
  });

  it("passes the status through to the service", async () => {
    const { controller, service } = make();
    await controller.getCustomWorkflowList("ALL");
    expect(service.getCustomWorkflowList).toHaveBeenCalledWith("ALL");
  });
});

describe("GET /get/artisan/custom-workflow-list/:status", () => {
  it("returns the artisan's previews under `workflowList`, scoped by the token", async () => {
    const rows = [{ id: 4 }];
    const { controller, service } = make({ getArtisanCustomWorkflowList: vi.fn().mockResolvedValue(rows) });

    await expect(controller.getArtisanCustomWorkflowList("ALL", tenant(9))).resolves.toEqual({
      success: true,
      message: "",
      workflowList: rows,
    });
    expect(service.getArtisanCustomWorkflowList).toHaveBeenCalledWith(9, "ALL");
  });

  it("is empty when the artisan has no assigned custom workflows", async () => {
    const { controller } = make();
    await expect(controller.getArtisanCustomWorkflowList("ALL", tenant())).resolves.toEqual({
      success: true,
      message: "",
      workflowList: [],
    });
  });

  it("refuses to run without a resolvable tenant rather than reading everything", async () => {
    const { controller } = make();
    await expect(controller.getArtisanCustomWorkflowList("ALL", undefined as never)).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe("GET /get/custom-order/:orderId/workflow-list", () => {
  it("returns summaries under `workflowList`", async () => {
    const rows = [{ workflowId: 7, workflowName: "Weaving" }];
    const { controller, service } = make({ getCustomOrderWorkflowList: vi.fn().mockResolvedValue(rows) });

    await expect(controller.getCustomOrderWorkflowList("300")).resolves.toEqual({
      success: true,
      message: "",
      workflowList: rows,
    });
    expect(service.getCustomOrderWorkflowList).toHaveBeenCalledWith(300);
  });

  it("returns an empty list for an order with no workflows", async () => {
    const { controller } = make();
    await expect(controller.getCustomOrderWorkflowList("300")).resolves.toEqual({
      success: true,
      message: "",
      workflowList: [],
    });
  });

  it("rejects a non-numeric orderId instead of querying with NaN", async () => {
    const { controller, service } = make();
    await expect(controller.getCustomOrderWorkflowList("abc")).rejects.toThrow(BadRequestException);
    expect(service.getCustomOrderWorkflowList).not.toHaveBeenCalled();
  });
});

describe("GET /get/custom-order/:orderId/workflow/:orderItemId", () => {
  it("returns the tree under Loom's `workflow` key", async () => {
    const workflow = { workflowId: 7, workflowName: "Weaving", status: "INITIATED", steps: [] };
    const { controller, service } = make({ getOrderwiseWorkflow: vi.fn().mockResolvedValue(workflow) });

    await expect(controller.getOrderwiseCustomWorkflow("300", "400", tenant(9))).resolves.toEqual({
      success: true,
      message: "",
      workflow,
    });
    expect(service.getOrderwiseWorkflow).toHaveBeenCalledWith(9, 300, 400);
  });

  it("returns a null workflow when there is none in the caller's scope", async () => {
    const { controller } = make();
    await expect(controller.getOrderwiseCustomWorkflow("300", "400", tenant())).resolves.toEqual({
      success: true,
      message: "",
      workflow: null,
    });
  });
});

describe("POST /add/custom-workflow", () => {
  it("returns Loom's NEW_WORKFLOW_CREATED envelope", async () => {
    const { controller, service } = make();

    await expect(controller.addCustomWorkflow(validAddBody, tenant(9))).resolves.toEqual({
      success: true,
      message: "New workflow created",
    });
    expect(service.addCustomWorkflow).toHaveBeenCalledWith(expect.objectContaining({ name: "Weaving" }), 9);
  });

  it("rejects a body with no steps before reaching the service", async () => {
    const { controller, service } = make();
    await expect(controller.addCustomWorkflow({ ...validAddBody, steps: [] }, tenant())).rejects.toThrow(
      BadRequestException,
    );
    expect(service.addCustomWorkflow).not.toHaveBeenCalled();
  });

  it("rejects a step tree with more than one primary step", async () => {
    const { controller } = make();
    const body = {
      ...validAddBody,
      steps: [
        validAddBody.steps[0],
        { ...validAddBody.steps[0], element: { elementId: "e-f-g-h", type: "STEP", posX: 1, posY: 1 } },
      ],
    };
    await expect(controller.addCustomWorkflow(body, tenant())).rejects.toThrow(/exactly one primary step/);
  });
});

describe("PATCH /update/custom-workflow", () => {
  it("returns Loom's WORKFLOW_UPDATED envelope", async () => {
    const { controller } = make();
    await expect(
      controller.updateCustomWorkflow({ id: 7, name: "Weaving", status: "INITIATED" }),
    ).resolves.toEqual({ success: true, message: "Workflow updated" });
  });

  it("reports a missing workflow as a failure envelope, matching Loom's NO_ACTION", async () => {
    const { controller } = make({ updateCustomWorkflow: vi.fn().mockResolvedValue("NOT_FOUND") });
    await expect(controller.updateCustomWorkflow({ id: 7, name: "Weaving", status: "INITIATED" })).resolves.toEqual({
      success: false,
      message: "No custom workflow found for the given id",
    });
  });

  it("reports a base-pay conflict as a failure envelope", async () => {
    const { controller } = make({ updateCustomWorkflow: vi.fn().mockResolvedValue("BASE_PAY_CONFLICT") });
    await expect(controller.updateCustomWorkflow({ id: 7, name: "Weaving", status: "INITIATED" })).resolves.toEqual({
      success: false,
      message: "An artisan already holds a different base pay on this workflow",
    });
  });

  it("rejects an unknown status rather than ignoring the field", async () => {
    const { controller, service } = make();
    await expect(controller.updateCustomWorkflow({ id: 7, name: "Weaving", status: "ARCHIVED" })).rejects.toThrow(
      BadRequestException,
    );
    expect(service.updateCustomWorkflow).not.toHaveBeenCalled();
  });

  it("rejects a body with no status at all — Loom's isTypeValid(null) is false", async () => {
    const { controller } = make();
    await expect(controller.updateCustomWorkflow({ id: 7, name: "Weaving" })).rejects.toThrow(BadRequestException);
  });
});
