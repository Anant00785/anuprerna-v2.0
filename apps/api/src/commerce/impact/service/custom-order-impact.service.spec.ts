/**
 * Loom CustomImpactFactorDAOController.calculateCustomOrderImpact — the
 * orchestration around the formulas: scoping, skipping, counting, and the
 * single transaction the Java's @Transactional implies.
 */
import { describe, it, expect, vi } from "vitest";
import { CustomOrderImpactService } from "./custom-order-impact.service.js";
import { CustomImpactCalculationService } from "./custom-impact-calculation.service.js";
import type { CustomImpactRepository, ImpactOrder, ImpactOrderItem } from "../repository/custom-impact.repository.js";
import type { ImpactAssumptions } from "../dto/impact-assumptions.js";
import type { ImpactWorkflowMetrics } from "./custom-impact-calculation.service.js";

const assumptions: ImpactAssumptions = {
  assumptionVersion: 4,
  carbonDioxideSavedKgPerMeter: 2.5,
  waterSavedLitersPerMeter: 90,
  womenArtisanWorkPercentage: 0.75,
  womenStitchingWorkPercentage: 0.8,
};

interface RepoOverrides {
  order?: ImpactOrder | null;
  assumptions?: ImpactAssumptions | null;
  items?: ImpactOrderItem[];
  workflows?: Map<number, ImpactWorkflowMetrics>;
  existing?: Map<number, { id: number; createdAt: number }>;
  customProductGroups?: Map<number, string | null>;
  failOnItemId?: number;
}

function makeRepo(over: RepoOverrides = {}) {
  const committed: unknown[] = [];
  const staged: unknown[] = [];
  const deleted: number[] = [];

  const repo = {
    // A real transaction: writes land in `staged` and only reach `committed`
    // when the callback resolves. A throw discards them, exactly as a rollback
    // does, which is what the "partial cascade cannot commit" test asserts.
    inTransaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => {
      staged.length = 0;
      const result = await work({});
      committed.push(...staged);
      return result;
    }),
    findOrderForImpact: vi.fn().mockResolvedValue(over.order === undefined ? { id: 5, tenantId: 77 } : over.order),
    findImpactAssumptions: vi
      .fn()
      .mockResolvedValue(over.assumptions === undefined ? assumptions : over.assumptions),
    findOrderItems: vi.fn().mockResolvedValue(over.items ?? []),
    findWorkflowMetricsByOrderItem: vi.fn().mockResolvedValue(over.workflows ?? new Map()),
    findCustomProductGroup: vi.fn(async (id: number) => over.customProductGroups?.get(id) ?? null),
    findImpactByOrderItem: vi.fn(async (itemId: number) => over.existing?.get(itemId) ?? null),
    deleteImpactByOrderItem: vi.fn(async (itemId: number) => {
      deleted.push(itemId);
    }),
    saveImpact: vi.fn(async (existingId: number | null, row: { customOrderItemId: number }) => {
      if (over.failOnItemId !== undefined && row.customOrderItemId === over.failOnItemId) {
        throw new Error("write failed mid-cascade");
      }
      staged.push({ existingId, ...row });
    }),
  };

  return {
    repo,
    committed,
    deleted,
    service: new CustomOrderImpactService(
      repo as unknown as CustomImpactRepository,
      new CustomImpactCalculationService(),
    ),
  };
}

const item = (over: Partial<ImpactOrderItem> & { id: number }): ImpactOrderItem => ({
  productGroup: "fabric",
  quantity: 1,
  customization: {},
  ...over,
});

describe("calculateCustomOrderImpact — order resolution", () => {
  it("returns a zeroed result and writes nothing for an absent order", async () => {
    const { service, repo, committed } = makeRepo({ order: null });

    await expect(service.calculateCustomOrderImpact(9, null)).resolves.toEqual({
      orderId: 9,
      created: 0,
      updated: 0,
      skipped: 0,
      complete: 0,
      partial: 0,
      configurationError: null,
      skippedItems: [],
    });
    expect(repo.saveImpact).not.toHaveBeenCalled();
    expect(committed).toHaveLength(0);
  });

  it("passes the tenant scope through to the order lookup", async () => {
    const { service, repo } = makeRepo();
    await service.calculateCustomOrderImpact(5, 42);
    expect(repo.findOrderForImpact).toHaveBeenCalledWith(5, 42, expect.anything());
  });
});

describe("calculateCustomOrderImpact — missing assumptions", () => {
  it("skips EVERY item and writes nothing, rather than substituting constants", async () => {
    const { service, repo, committed } = makeRepo({
      assumptions: null,
      items: [item({ id: 1 }), item({ id: 2 })],
    });

    const result = await service.calculateCustomOrderImpact(5, null);

    expect(result.configurationError).toBe("IMPACT_ASSUMPTIONS_NOT_CONFIGURED");
    expect(result.skipped).toBe(2);
    expect(result.skippedItems).toEqual([
      { orderItemId: 1, reason: "IMPACT_ASSUMPTIONS_NOT_CONFIGURED" },
      { orderItemId: 2, reason: "IMPACT_ASSUMPTIONS_NOT_CONFIGURED" },
    ]);
    expect(result.created).toBe(0);
    expect(repo.saveImpact).not.toHaveBeenCalled();
    expect(committed).toHaveLength(0);
  });
});

describe("calculateCustomOrderImpact — per-item classification", () => {
  it("counts created vs updated, and COMPLETE vs PARTIAL", async () => {
    const { service, committed } = makeRepo({
      items: [
        item({ id: 1, productGroup: "fabric", quantity: 4 }),
        item({ id: 2, productGroup: "finished", quantity: 3 }),
      ],
      workflows: new Map([[1, { id: 11, avgArtisanWorkHoursPerMeter: 1.5, avgWorkHoursPerProduct: null }]]),
      existing: new Map([[2, { id: 900, createdAt: 1 }]]),
    });

    const result = await service.calculateCustomOrderImpact(5, null);

    // item 1: new row, has a workflow with a per-meter rate -> COMPLETE
    // item 2: existing row, NO workflow -> PARTIAL (WORKFLOW_NOT_CONFIGURED)
    expect(result).toMatchObject({ orderId: 5, created: 1, updated: 1, complete: 1, partial: 1, skipped: 0 });
    expect(committed).toHaveLength(2);
  });

  it("skips an unsupported product group without writing", async () => {
    const { service, committed } = makeRepo({ items: [item({ id: 1, productGroup: "accessory" })] });
    const result = await service.calculateCustomOrderImpact(5, null);

    expect(result.skippedItems).toEqual([{ orderItemId: 1, reason: "UNSUPPORTED_PRODUCT_GROUP" }]);
    expect(result.skipped).toBe(1);
    expect(committed).toHaveLength(0);
  });

  it("skips a fabric swatch AND deletes its stale impact row", async () => {
    const { service, committed, deleted } = makeRepo({
      items: [
        item({
          id: 1,
          productGroup: "fabric",
          customization: { fabricProductPreview: { product: { name: "Indigo Swatch Card" } } },
        }),
      ],
    });

    const result = await service.calculateCustomOrderImpact(5, null);

    expect(result.skippedItems).toEqual([{ orderItemId: 1, reason: "SWATCH_PRODUCT_EXCLUDED" }]);
    expect(deleted).toEqual([1]);
    expect(committed).toHaveLength(0);
  });

  it("resolves a 'custom' item's real group through the embedded custom product", async () => {
    const { service, committed } = makeRepo({
      items: [item({ id: 1, productGroup: "custom", quantity: 2, customization: { customProduct: { productGroup: "finished" } } })],
      workflows: new Map([[1, { id: 11, avgArtisanWorkHoursPerMeter: null, avgWorkHoursPerProduct: 2 }]]),
    });

    const result = await service.calculateCustomOrderImpact(5, null);

    expect(result).toMatchObject({ created: 1, complete: 1, skipped: 0 });
    expect(committed[0]).toMatchObject({
      customOrderItemId: 1,
      productType: "APPAREL",
      metrics: expect.objectContaining({ totalWorkHours: 4, stitchingHours: 4, womenStitchingHours: 3.2 }),
    });
  });

  it("resolves a 'custom' item's group by looking the custom product up", async () => {
    const { service, repo, committed } = makeRepo({
      items: [item({ id: 1, productGroup: "custom", quantity: 2, customization: { customProductId: 88 } })],
      customProductGroups: new Map([[88, "fabric"]]),
    });

    await service.calculateCustomOrderImpact(5, null);

    expect(repo.findCustomProductGroup).toHaveBeenCalledWith(88, expect.anything());
    expect(committed[0]).toMatchObject({ productType: "FABRIC" });
  });

  it("skips a 'custom' item whose group cannot be resolved, rather than guessing", async () => {
    const { service, committed } = makeRepo({
      items: [item({ id: 1, productGroup: "custom", customization: { customProductId: 0 } })],
    });
    const result = await service.calculateCustomOrderImpact(5, null);

    expect(result.skippedItems).toEqual([{ orderItemId: 1, reason: "UNSUPPORTED_PRODUCT_GROUP" }]);
    expect(committed).toHaveLength(0);
  });
});

describe("calculateCustomOrderImpact — transactionality", () => {
  it("runs the whole recalculation inside ONE transaction", async () => {
    const { service, repo } = makeRepo({ items: [item({ id: 1 }), item({ id: 2 })] });
    await service.calculateCustomOrderImpact(5, null);
    expect(repo.inTransaction).toHaveBeenCalledTimes(1);
  });

  it("commits NOTHING when a write fails part-way through the order", async () => {
    const { service, committed } = makeRepo({
      items: [item({ id: 1, quantity: 4 }), item({ id: 2, quantity: 4 }), item({ id: 3, quantity: 4 })],
      failOnItemId: 2,
    });

    await expect(service.calculateCustomOrderImpact(5, null)).rejects.toThrow("write failed mid-cascade");

    // item 1 was written before the failure; the rollback must discard it, or
    // the order is left half-recalculated against the new assumptions.
    expect(committed).toHaveLength(0);
  });
});
