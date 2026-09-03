/**
 * Cart enrichment is a pricing-visible path, and it was rewritten from
 * "one awaited query per cart line" to "batched up front, mapped in memory"
 * (see prepareCartItems). This locks the behaviour that rewrite had to
 * preserve:
 *
 *  - the per-line preference order product_fabric/product_finished join ->
 *    bare product row -> port fallback,
 *  - finish CSV token order, and "last resolved finish wins" for
 *    finishDisplayName,
 *  - a cart line whose referenced row no longer exists still yields null
 *    rather than throwing,
 *  - and, the point of the change: the number of round trips no longer grows
 *    with the number of cart lines.
 *
 * The Drizzle query builder is faked at the `repo.db` seam the service already
 * uses, so this runs with no database.
 */
import { describe, expect, it } from "vitest";
import { CartService } from "./cart.service.js";
import { finishProfileItem, product, productFabric, productFinished, sizeProfileOption } from "../../../database/schema/schema.js";

type Row = Record<string, unknown>;

/**
 * Minimal stand-in for the drizzle builder chain the service calls:
 * `.select(...).from(t).innerJoin(...)?.where(...)` resolving to rows.
 * Records one entry per executed statement so round trips can be counted.
 */
function fakeDb(tables: { fabric: Row[]; finished: Row[]; product: Row[]; sizeOption: Row[]; finish: Row[] }) {
  const byTable = new Map<unknown, Row[]>([
    [productFabric, tables.fabric],
    [productFinished, tables.finished],
    [product, tables.product],
    [sizeProfileOption, tables.sizeOption],
    [finishProfileItem, tables.finish],
  ]);
  const statements: unknown[] = [];
  const chainFor = () => {
    let rows: Row[] = [];
    const chain: Record<string, unknown> = {
      from: (table: unknown) => {
        rows = byTable.get(table) ?? [];
        statements.push(table);
        return chain;
      },
      innerJoin: () => chain,
      // The service always ends the chain on .where(...), which is awaited.
      where: () => Promise.resolve(rows),
    };
    return chain;
  };
  return { statements, db: { select: () => chainFor() } };
}

const line = (over: Partial<Row>): Row => ({
  id: 1n,
  version: 0n,
  fabricProductId: null,
  finishedProductId: null,
  selectedFabricId: null,
  selectedSizeOptionId: null,
  selectedFinishId: "",
  customSize: null,
  productGroup: "fabric",
  orderType: "REGULAR",
  quantity: 1,
  unit: "METER",
  makingCharge: 0,
  lastUpdatedAt: 0,
  clickId: null,
  clickIdType: null,
  clickCapturedAt: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  ...over,
});

function makeService(
  tables: Parameters<typeof fakeDb>[0],
  ports: Partial<{
    fabricPreviewEntity: unknown;
    selectedFabric: unknown;
    finishedPreviewEntity: unknown;
  }> = {},
) {
  const { statements, db } = fakeDb(tables);
  const portCalls: string[] = [];
  const service = new CartService(
    { db } as never,
    {
      retrieveEntity: async () => {
        portCalls.push("fabricPreview.retrieveEntity");
        return ports.fabricPreviewEntity ?? null;
      },
      retrieveFabricProductByProductId: async () => {
        portCalls.push("selectedFabric");
        return ports.selectedFabric ?? null;
      },
    } as never,
    {
      retrieveEntity: async () => {
        portCalls.push("finishedPreview.retrieveEntity");
        return ports.finishedPreviewEntity ?? null;
      },
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, statements, portCalls };
}

describe("prepareCartItems batching", () => {
  it("does not issue more queries as the cart grows", async () => {
    const tables = {
      fabric: [{ id: 10n, product: { id: 1, name: "f" } }],
      finished: [],
      product: [],
      sizeOption: [{ id: 20n, name: "M" }],
      finish: [],
    };

    const oneLine = makeService(tables);
    await oneLine.service.prepareCartItems([
      line({ id: 1n, fabricProductId: 10, selectedSizeOptionId: 20 }),
    ] as never);

    const tenLines = makeService(tables);
    await tenLines.service.prepareCartItems(
      Array.from({ length: 10 }, (_, i) => line({ id: BigInt(i), fabricProductId: 10, selectedSizeOptionId: 20 })) as never,
    );

    // Same ids on every line -> identical statement count regardless of size.
    expect(tenLines.statements.length).toBe(oneLine.statements.length);
    // And it is a small constant, not one-per-line.
    expect(tenLines.statements.length).toBeLessThanOrEqual(3);
  });

  it("falls back to the bare product row when no product_fabric row exists", async () => {
    const { service, portCalls } = makeService({
      fabric: [],
      finished: [],
      product: [{ id: 10n, productId: 10n, product: { id: 10, name: "bare" } }],
      sizeOption: [],
      finish: [],
    });
    const [view] = await service.prepareCartItems([line({ fabricProductId: 10 })] as never);
    expect((view.fabricProductPreview as Row).product).toEqual({ id: 10, name: "bare" });
    expect(portCalls).not.toContain("fabricPreview.retrieveEntity");
  });

  it("falls through to the port only when neither table has the id", async () => {
    const { service, portCalls } = makeService(
      { fabric: [], finished: [], product: [], sizeOption: [], finish: [] },
      { fabricPreviewEntity: { id: 10, via: "port" } },
    );
    const [view] = await service.prepareCartItems([line({ fabricProductId: 10 })] as never);
    expect(view.fabricProductPreview).toEqual({ id: 10, via: "port" });
    expect(portCalls).toContain("fabricPreview.retrieveEntity");
  });

  it("resolves a missing size option to null instead of throwing", async () => {
    const { service } = makeService({ fabric: [], finished: [], product: [], sizeOption: [], finish: [] });
    const [view] = await service.prepareCartItems([line({ selectedSizeOptionId: 999 })] as never);
    expect(view.selectedSizeOption).toBeNull();
  });

  it("keeps finish CSV token order and last-one-wins finishDisplayName", async () => {
    const { service } = makeService({
      fabric: [],
      finished: [],
      product: [],
      sizeOption: [],
      // finish_profile_item is read as a join projection: { item, finishProfile }.
      finish: [
        { item: { id: 1n }, finishProfile: { displayName: "First" } },
        { item: { id: 2n }, finishProfile: { displayName: "Second" } },
      ],
    });
    const [view] = await service.prepareCartItems([line({ selectedFinishId: "2, 1" })] as never);
    expect((view.selectedFinishList as Row[]).map((f) => Number(f.id))).toEqual([2, 1]);
    expect(view.finishDisplayName).toBe("First"); // last token that resolved
  });

  it("skips non-numeric finish tokens rather than throwing on BigInt()", async () => {
    const { service } = makeService({
      fabric: [],
      finished: [],
      product: [],
      sizeOption: [],
      finish: [{ item: { id: 1n }, finishProfile: { displayName: "Only" } }],
    });
    const [view] = await service.prepareCartItems([line({ selectedFinishId: "abc,1," })] as never);
    expect((view.selectedFinishList as Row[]).map((f) => Number(f.id))).toEqual([1]);
  });

  it("returns an empty list for an empty cart without querying", async () => {
    const { service, statements } = makeService({ fabric: [], finished: [], product: [], sizeOption: [], finish: [] });
    expect(await service.prepareCartItems([])).toEqual([]);
    expect(statements).toHaveLength(0);
  });
});
