import { describe, it, expect, vi } from "vitest";
import { BadRequestException, NotImplementedException } from "@nestjs/common";
import { CustomWorkflowService } from "./custom-workflow.service.js";
import type { CustomWorkflowRepository } from "../repository/custom-workflow.repository.js";
import type { CustomWorkflowWriteRepository, StoredWorkflow } from "../repository/custom-workflow-write.repository.js";
import type { CustomOrderImpactService } from "../../impact/service/custom-order-impact.service.js";
import type { AddCustomWorkflowInput, UpdateCustomWorkflowInput } from "../dto/custom-workflow.dto.js";

interface Options {
  workflow?: StoredWorkflow | null;
  conflict?: boolean;
  templateExists?: boolean;
  itemBelongs?: boolean;
  customOrderId?: number | null;
  failCascade?: boolean;
}

function make(options: Options = {}) {
  const committed: string[] = [];
  const staged: string[] = [];

  const writeRepo = {
    inTransaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => {
      staged.length = 0;
      const result = await work({});
      committed.push(...staged);
      return result;
    }),
    workflowTemplateExists: vi.fn().mockResolvedValue(options.templateExists ?? true),
    customOrderItemBelongsToOrder: vi.fn().mockResolvedValue(options.itemBelongs ?? true),
    addCustomWorkflow: vi.fn(async () => {
      staged.push("workflow");
      staged.push("mapping");
      if (options.failCascade) throw new Error("mapping insert failed");
      return 501;
    }),
    findWorkflow: vi
      .fn()
      .mockResolvedValue(
        options.workflow === undefined
          ? { id: 7, status: "INITIATED", tenantId: 9, type: "CUSTOM_ORDER" }
          : options.workflow,
      ),
    existsConflictingBasePay: vi.fn().mockResolvedValue(options.conflict ?? false),
    synchronizeArtisanAssignments: vi.fn(async () => {
      staged.push("assignments");
    }),
    applyWorkflowUpdate: vi.fn(async () => {
      staged.push("update");
    }),
    findCustomOrderIdForWorkflow: vi
      .fn()
      .mockResolvedValue(options.customOrderId === undefined ? 300 : options.customOrderId),
    findArtisanIdByTenant: vi.fn().mockResolvedValue(55),
    customOrderExistsForTenant: vi.fn().mockResolvedValue(true),
  };

  const repo = {
    findAllCustomWorkflows: vi.fn().mockResolvedValue([]),
    findAllCustomWorkflowsByArtisan: vi.fn().mockResolvedValue([]),
    findCustomWorkflowSummariesByOrderId: vi.fn().mockResolvedValue([]),
    findOrderwiseCustomWorkflow: vi.fn().mockResolvedValue([]),
    findCustomWorkflowDetail: vi.fn().mockResolvedValue(null),
  };

  const impact = { calculateCustomOrderImpact: vi.fn().mockResolvedValue({ orderId: 300 }) };

  return {
    repo,
    writeRepo,
    impact,
    committed,
    service: new CustomWorkflowService(
      repo as unknown as CustomWorkflowRepository,
      writeRepo as unknown as CustomWorkflowWriteRepository,
      impact as unknown as CustomOrderImpactService,
    ),
  };
}

const addInput: AddCustomWorkflowInput = {
  name: "Weaving",
  description: "",
  note: null,
  workflowTemplateId: 3,
  estimatedStartDate: 1_700_000_000_000,
  referenceOrderId: 300,
  referenceOrderItemId: 400,
  referenceProductId: 12,
  custom: true,
  avgArtisanWorkHoursPerMeter: 1.5,
  avgWorkHoursPerProduct: null,
  fabricUsedPerProductInMeters: null,
  steps: [],
};

const updateInput = (over: Partial<UpdateCustomWorkflowInput> = {}): UpdateCustomWorkflowInput => ({
  id: 7,
  name: "Weaving",
  description: "",
  note: null,
  status: "INITIATED",
  avgArtisanWorkHoursPerMeter: null,
  avgWorkHoursPerProduct: null,
  fabricUsedPerProductInMeters: null,
  artisanAssignments: null,
  ...over,
});

describe("getCustomWorkflowList", () => {
  it("upper-cases the status, as Loom's Locale.ROOT normalisation does", async () => {
    const { service, repo } = make();
    await service.getCustomWorkflowList("in_progress");
    expect(repo.findAllCustomWorkflows).toHaveBeenCalledWith("IN_PROGRESS");
  });

  it("does not blow up on a missing status", async () => {
    const { service, repo } = make();
    await service.getCustomWorkflowList(undefined as never);
    expect(repo.findAllCustomWorkflows).toHaveBeenCalledWith("");
  });
});

describe("getArtisanCustomWorkflowList", () => {
  it("resolves the artisan from the tenant and queries with that id", async () => {
    const { service, repo, writeRepo } = make();
    await service.getArtisanCustomWorkflowList(9, "all");
    expect(writeRepo.findArtisanIdByTenant).toHaveBeenCalledWith(9);
    expect(repo.findAllCustomWorkflowsByArtisan).toHaveBeenCalledWith(55, "ALL");
  });

  it("returns an empty list when the tenant is not an artisan, as Loom does", async () => {
    const { service, repo, writeRepo } = make();
    writeRepo.findArtisanIdByTenant.mockResolvedValue(null);
    await expect(service.getArtisanCustomWorkflowList(9, "ALL")).resolves.toEqual([]);
    expect(repo.findAllCustomWorkflowsByArtisan).not.toHaveBeenCalled();
  });
});

describe("getOrderwiseWorkflow", () => {
  const row = (over: Record<string, unknown> = {}) => ({
    workflowId: 7,
    workflowName: "Weaving",
    workflowStatus: "INITIATED",
    stepId: 1,
    stepName: "Dyeing",
    stepStatus: "PENDING",
    stepEstimatedStartDate: 100,
    stepEstimatedEndDate: 200,
    stepActualStartDate: 0,
    stepActualEndDate: 0,
    stepElementId: "a-b-c-d",
    previousStepElementId: "",
    nextStepElementId: "",
    subProcessId: 11,
    subProcessName: "Vat prep",
    subProcessStatus: "PENDING",
    subProcessEstimatedStartDate: 100,
    subProcessEstimatedEndDate: 150,
    subProcessActualStartDate: 0,
    subProcessActualEndDate: 0,
    subProcessElementId: "a-b-c-d-e",
    previousSubProcessElementId: "",
    nextSubProcessElementId: "",
    hasApprovedFeedback: false,
    feedbackId: 0,
    ...over,
  });

  it("folds the flat step x sub-process rows back into one tree", async () => {
    const { service, repo } = make();
    repo.findOrderwiseCustomWorkflow.mockResolvedValue([
      row(),
      row({ subProcessId: 12, subProcessName: "Dye bath" }),
      row({ stepId: 2, stepName: "Weaving", subProcessId: 13, subProcessName: "Warp" }),
    ]);

    const result = await service.getOrderwiseWorkflow(9, 300, 400);

    expect(result?.workflowId).toBe(7);
    expect(result?.status).toBe("INITIATED");
    expect(result?.steps).toHaveLength(2);
    expect(result?.steps[0].subProcesses.map((s) => s.subProcessId)).toEqual([11, 12]);
    expect(result?.steps[1].subProcesses.map((s) => s.subProcessId)).toEqual([13]);
  });

  it("renders a step with no sub-processes as an empty list, not a row of nulls", async () => {
    const { service, repo } = make();
    repo.findOrderwiseCustomWorkflow.mockResolvedValue([row({ subProcessId: null, subProcessName: null })]);

    const result = await service.getOrderwiseWorkflow(9, 300, 400);
    expect(result?.steps[0].subProcesses).toEqual([]);
  });

  it("is null for an order outside the caller's tenant, without querying the tree", async () => {
    const { service, repo, writeRepo } = make();
    writeRepo.customOrderExistsForTenant.mockResolvedValue(false);

    await expect(service.getOrderwiseWorkflow(9, 300, 400)).resolves.toBeNull();
    expect(repo.findOrderwiseCustomWorkflow).not.toHaveBeenCalled();
  });

  it("is null when the order has no workflow rows", async () => {
    const { service } = make();
    await expect(service.getOrderwiseWorkflow(9, 300, 400)).resolves.toBeNull();
  });
});

describe("addCustomWorkflow", () => {
  it("runs the whole cascade in one transaction and refreshes the order's impact", async () => {
    const { service, writeRepo, impact, committed } = make();

    await expect(service.addCustomWorkflow(addInput, 9)).resolves.toBe(501);
    expect(writeRepo.inTransaction).toHaveBeenCalledTimes(1);
    expect(committed).toEqual(["workflow", "mapping"]);
    expect(impact.calculateCustomOrderImpact).toHaveBeenCalledWith(300, null);
  });

  it("commits NOTHING when the cascade fails part-way", async () => {
    const { service, impact, committed } = make({ failCascade: true });

    await expect(service.addCustomWorkflow(addInput, 9)).rejects.toThrow("mapping insert failed");
    expect(committed).toEqual([]);
    expect(impact.calculateCustomOrderImpact).not.toHaveBeenCalled();
  });

  it("rejects an unknown workflow template before writing anything", async () => {
    const { service, writeRepo, committed } = make({ templateExists: false });

    await expect(service.addCustomWorkflow(addInput, 9)).rejects.toThrow(BadRequestException);
    expect(writeRepo.addCustomWorkflow).not.toHaveBeenCalled();
    expect(committed).toEqual([]);
  });

  it("rejects an order item that does not belong to the referenced order", async () => {
    const { service, writeRepo } = make({ itemBelongs: false });
    await expect(service.addCustomWorkflow(addInput, 9)).rejects.toThrow(BadRequestException);
    expect(writeRepo.addCustomWorkflow).not.toHaveBeenCalled();
  });

  it("does not fail the write when the impact refresh fails afterwards", async () => {
    const { service, impact } = make();
    impact.calculateCustomOrderImpact.mockRejectedValue(new Error("assumptions table locked"));
    await expect(service.addCustomWorkflow(addInput, 9)).resolves.toBe(501);
  });
});

describe("updateCustomWorkflow", () => {
  it("applies the update and refreshes impact", async () => {
    const { service, writeRepo, impact } = make();

    await expect(service.updateCustomWorkflow(updateInput())).resolves.toBe("UPDATED");
    expect(writeRepo.applyWorkflowUpdate).toHaveBeenCalledWith(7, expect.anything(), "INITIATED", expect.anything());
    expect(impact.calculateCustomOrderImpact).toHaveBeenCalledWith(300, null);
  });

  it("reports NOT_FOUND for an absent workflow, Loom's ActionCode.NO_ACTION", async () => {
    const { service, writeRepo } = make({ workflow: null });
    await expect(service.updateCustomWorkflow(updateInput())).resolves.toBe("NOT_FOUND");
    expect(writeRepo.applyWorkflowUpdate).not.toHaveBeenCalled();
  });

  it("reports NOT_FOUND for a STANDARD-order workflow — this route is custom-only", async () => {
    const { service } = make({ workflow: { id: 7, status: "INITIATED", tenantId: 9, type: "ORDER" } });
    await expect(service.updateCustomWorkflow(updateInput())).resolves.toBe("NOT_FOUND");
  });

  it("rejects an illegal transition back to CREATED before touching the row", async () => {
    const { service, writeRepo, committed } = make();
    await expect(service.updateCustomWorkflow(updateInput({ status: "CREATED" }))).rejects.toThrow(BadRequestException);
    expect(writeRepo.applyWorkflowUpdate).not.toHaveBeenCalled();
    expect(committed).toEqual([]);
  });

  it("refuses the transition into COMPLETED, naming the unported payment engine", async () => {
    const { service, writeRepo, committed } = make();
    await expect(service.updateCustomWorkflow(updateInput({ status: "COMPLETED" }))).rejects.toThrow(
      NotImplementedException,
    );
    await expect(service.updateCustomWorkflow(updateInput({ status: "COMPLETED" }))).rejects.toThrow(
      /calculateForWorkflow/,
    );
    expect(writeRepo.applyWorkflowUpdate).not.toHaveBeenCalled();
    expect(committed).toEqual([]);
  });

  it("allows re-saving an ALREADY COMPLETED workflow — no new payment run is due", async () => {
    const { service } = make({ workflow: { id: 7, status: "COMPLETED", tenantId: 9, type: "CUSTOM_ORDER" } });
    await expect(service.updateCustomWorkflow(updateInput({ status: "COMPLETED" }))).resolves.toBe("UPDATED");
  });

  it("rejects a base-pay conflict and commits nothing", async () => {
    const { service, writeRepo, committed } = make({ conflict: true });

    const input = updateInput({
      artisanAssignments: [{ artisanId: 5, quantityOfFabricInMeters: 10, quantityOfProducts: null, basePay: 120 }],
    });

    await expect(service.updateCustomWorkflow(input)).resolves.toBe("BASE_PAY_CONFLICT");
    expect(writeRepo.synchronizeArtisanAssignments).not.toHaveBeenCalled();
    expect(writeRepo.applyWorkflowUpdate).not.toHaveBeenCalled();
    expect(committed).toEqual([]);
  });

  it("synchronizes assignments and updates the row in ONE transaction", async () => {
    const { service, writeRepo, committed } = make();

    const input = updateInput({
      artisanAssignments: [{ artisanId: 5, quantityOfFabricInMeters: 10, quantityOfProducts: null, basePay: 120 }],
    });

    await expect(service.updateCustomWorkflow(input)).resolves.toBe("UPDATED");
    expect(writeRepo.inTransaction).toHaveBeenCalledTimes(1);
    expect(committed).toEqual(["assignments", "update"]);
  });

  it("leaves assignments alone when the body omits them, as Loom's null no-op does", async () => {
    const { service, writeRepo } = make();
    await service.updateCustomWorkflow(updateInput({ artisanAssignments: null }));
    expect(writeRepo.synchronizeArtisanAssignments).not.toHaveBeenCalled();
    expect(writeRepo.existsConflictingBasePay).not.toHaveBeenCalled();
  });
});

/**
 * Loom: CustomWorkflowDAOController.retrieveWorkflow. The shape here is the
 * CMS's CustomWorkflowDetail (apps/cms/src/lib/artisanflow-api.ts) — a drift in
 * any of these key names is an empty CMS screen with no error, which is exactly
 * how the `data` vs `workflowTemplateList` mismatch was missed twice.
 */
describe("CustomWorkflowService.getCustomWorkflowDetail", () => {
  const row = () => ({
    id: "7",
    name: "Weaving",
    description: "Handloom run",
    note: null,
    status: "IN_PROGRESS",
    type: "CUSTOM_ORDER",
    estimatedStartDate: "1700000000000",
    estimatedEndDate: "1700900000000",
    createdAt: "1699000000000",
    updatedAt: "1699500000000",
    avgArtisanWorkHoursPerMeter: "1.50",
    avgWorkHoursPerProduct: null,
    fabricUsedPerProductInMeters: null,
    templateId: "3",
    templateName: "Standard saree",
    referenceOrderId: "300",
    referenceOrderItemId: "400",
    custom: true,
    referenceProductId: "12",
    steps: [{ id: 11, name: "Dyeing", subProcesses: [] }],
    artisanAssignments: [{ artisanId: 55, quantityOfFabricInMeters: 12.5, quantityOfProducts: null, basePay: 300 }],
  });

  it("maps the row onto the CMS CustomWorkflowDetail contract", async () => {
    const { service, repo } = make();
    repo.findCustomWorkflowDetail.mockResolvedValue(row());

    await expect(service.getCustomWorkflowDetail(7)).resolves.toEqual({
      id: 7,
      name: "Weaving",
      description: "Handloom run",
      note: null,
      status: "IN_PROGRESS",
      type: "CUSTOM_ORDER",
      custom: true,
      estimatedStartDate: 1_700_000_000_000,
      estimatedEndDate: 1_700_900_000_000,
      createdAt: 1_699_000_000_000,
      updatedAt: 1_699_500_000_000,
      avgArtisanWorkHoursPerMeter: 1.5,
      avgWorkHoursPerProduct: null,
      fabricUsedPerProductInMeters: null,
      workflowTemplate: { id: 3, name: "Standard saree" },
      referenceOrderId: 300,
      referenceOrderItemId: 400,
      referenceProductId: 12,
      steps: [{ id: 11, name: "Dyeing", subProcesses: [] }],
      artisanAssignments: [{ artisanId: 55, quantityOfFabricInMeters: 12.5, basePay: 300 }],
    });
    expect(repo.findCustomWorkflowDetail).toHaveBeenCalledWith(7);
  });

  it("omits the absent quantity key rather than emitting a null that reads as zero", async () => {
    const { service, repo } = make();
    repo.findCustomWorkflowDetail.mockResolvedValue({
      ...row(),
      artisanAssignments: [{ artisanId: 55, quantityOfFabricInMeters: null, quantityOfProducts: 4, basePay: null }],
    });

    const detail = await service.getCustomWorkflowDetail(7);
    expect(detail?.artisanAssignments).toEqual([{ artisanId: 55, quantityOfProducts: 4 }]);
    expect(detail?.artisanAssignments[0]).not.toHaveProperty("quantityOfFabricInMeters");
    expect(detail?.artisanAssignments[0]).not.toHaveProperty("basePay");
  });

  it("returns an EMPTY assignment list, not a fabricated one, for an unassigned workflow", async () => {
    const { service, repo } = make();
    repo.findCustomWorkflowDetail.mockResolvedValue({ ...row(), artisanAssignments: [], steps: [] });

    const detail = await service.getCustomWorkflowDetail(7);
    expect(detail?.artisanAssignments).toEqual([]);
    expect(detail?.steps).toEqual([]);
  });

  it("is null for a workflow with no custom-order mapping (a standard-order id)", async () => {
    const { service, repo } = make();
    repo.findCustomWorkflowDetail.mockResolvedValue(null);
    await expect(service.getCustomWorkflowDetail(7)).resolves.toBeNull();
  });

  it("propagates a query failure instead of returning null — absent and broken must differ", async () => {
    const { service, repo } = make();
    repo.findCustomWorkflowDetail.mockRejectedValue(new Error("connection reset"));
    await expect(service.getCustomWorkflowDetail(7)).rejects.toThrow("connection reset");
  });
});
