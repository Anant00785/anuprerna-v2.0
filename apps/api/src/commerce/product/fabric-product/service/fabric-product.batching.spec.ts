/**
 * Guards the two behaviour-preserving invariants of the PDP query-batching
 * work (see fabric-product.service.ts / fabric-product.module.ts):
 *
 *  1. The CSV columns (color_id, material_id, pattern_id, tag_id) are now
 *     resolved with one `WHERE id = ANY($1)` instead of one query per token.
 *     Batched reads come back in arbitrary order, so the service has to
 *     re-index them into CSV token order — and must keep the old
 *     `null`-for-a-missing-row and duplicate-token behaviour that the
 *     per-token `retrieveEntity` version had.
 *
 *  2. Every enrichment lookup runs in ONE `Promise.all`, not one `await` per
 *     line. On a ~300ms-RTT database each extra serialised await was ~300ms of
 *     wall clock, and the shape is easy to regress by adding a stray `await`.
 */
import { describe, expect, it } from "vitest";
import { FabricProductService } from "./fabric-product.service.js";

/** Reaches the private static helper without widening its visibility. */
const prepareCsvLookup = (FabricProductService as never as {
  prepareCsvLookup(
    csv: string | null,
    port: { retrieveEntities(ids: number[]): Promise<{ id: number }[]> },
  ): Promise<unknown[]>;
}).prepareCsvLookup;

/** Stands in for a table: answers ANY($1) out of order, and records call count. */
function fakePort(rows: { id: number; name: string }[]) {
  const calls: number[][] = [];
  return {
    calls,
    retrieveEntities: async (ids: number[]) => {
      calls.push(ids);
      // Deliberately reversed: a batched read gives no ordering guarantee.
      return rows.filter((row) => ids.includes(row.id)).reverse();
    },
  };
}

describe("prepareCsvLookup", () => {
  const rows = [
    { id: 1, name: "one" },
    { id: 2, name: "two" },
    { id: 3, name: "three" },
  ];

  it("issues exactly one query for a whole CSV column", async () => {
    const port = fakePort(rows);
    await prepareCsvLookup("3,1,2", port);
    expect(port.calls).toHaveLength(1);
    expect(port.calls[0].sort()).toEqual([1, 2, 3]);
  });

  it("returns rows in CSV token order, not query order", async () => {
    const port = fakePort(rows);
    expect(await prepareCsvLookup("3,1,2", port)).toEqual([
      { id: 3, name: "three" },
      { id: 1, name: "one" },
      { id: 2, name: "two" },
    ]);
  });

  it("yields null for a token with no row — as retrieveEntity(id) used to", async () => {
    const port = fakePort(rows);
    expect(await prepareCsvLookup("1,99,2", port)).toEqual([
      { id: 1, name: "one" },
      null,
      { id: 2, name: "two" },
    ]);
  });

  it("keeps duplicate tokens duplicated but queries each id once", async () => {
    const port = fakePort(rows);
    expect(await prepareCsvLookup("2,2", port)).toEqual([
      { id: 2, name: "two" },
      { id: 2, name: "two" },
    ]);
    expect(port.calls[0]).toEqual([2]);
  });

  it("short-circuits an empty or absent column without touching the database", async () => {
    const port = fakePort(rows);
    expect(await prepareCsvLookup("", port)).toEqual([]);
    expect(await prepareCsvLookup(null, port)).toEqual([]);
    expect(port.calls).toHaveLength(0);
  });
});

describe("assembleView query concurrency", () => {
  /**
   * Fails if any enrichment lookup is moved back out of the shared
   * `Promise.all` — a serialised lookup cannot start while another is still
   * in flight, so `maxConcurrent` drops below the number of lookups.
   */
  it("fires every enrichment lookup concurrently rather than one at a time", async () => {
    let inFlight = 0;
    let maxConcurrent = 0;
    const track = async <T>(value: T): Promise<T> => {
      maxConcurrent = Math.max(maxConcurrent, ++inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight--;
      return value;
    };

    const product = {
      id: 1,
      colorId: "1",
      materialId: "1",
      patternId: "1",
      tagId: "1",
      sizeProfileId: 7,
      subCategoryId: 3,
      madeToOrderFabricId: 9,
      fabricProfileId: 11,
      quantity: 0,
      externalQuantity: 0,
    };

    const lookupPort = { retrieveEntities: async (ids: number[]) => track(ids.map((id) => ({ id }))) };
    const service = new FabricProductService(
      {} as never,
      { retrieveProductById: async () => track({ ...product, quantity: 0, externalQuantity: 0 }) } as never,
      {} as never,
      lookupPort as never,
      lookupPort as never,
      lookupPort as never,
      lookupPort as never,
      { prepareRelatedProductList: async () => track([]) } as never,
      { prepareSizeProfile: async () => track(null) } as never,
      { retrieveEnrichedItems: async () => track([]) } as never,
      { retrieveHierarchy: async () => track(null) } as never,
      {} as never,
      {} as never,
    );

    // assembleView is private; reached through a cast rather than adding a
    // test-only seam to the service.
    const assembleView = (service as never as {
      assembleView(row: Promise<unknown>, product: unknown): Promise<unknown>;
    }).assembleView.bind(service);

    const view = await assembleView(
      track({ id: 1n, version: 0n, productId: 1, gsm: 0, addToSwatch: true, width: "" }),
      product,
    );
    expect(view).not.toBeNull();
    // fabric row + 4 CSV batches + related + sizeProfile + hierarchy + MTO + profile items
    expect(maxConcurrent).toBe(10);
  });
});
