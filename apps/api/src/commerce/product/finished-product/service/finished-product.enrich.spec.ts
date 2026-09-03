import { describe, it, expect, vi } from "vitest";
import { FinishedProductService } from "./finished-product.service.js";

/**
 * Regression guard for the enrichment id mapping: colour / material / pattern
 * / tag / size-profile were all looked up with the PRODUCT id instead of the
 * ids carried on the product row, so five of the ten queries behind
 * /get/finished-product/slug/:slug returned null.
 */
describe("FinishedProductService enrichment id mapping", () => {
  const PRODUCT_ID = 159274760;
  const productRow = {
    id: PRODUCT_ID,
    slug: "ruffled-princess-buttoned-short-dress",
    colorId: "2703",
    materialId: "2570",
    patternId: "2747,2737,33945134",
    tagId: "",
    sizeProfileId: 57424,
  };

  function build() {
    const calls: Record<string, unknown[]> = { color: [], material: [], pattern: [], tag: [], sizeProfile: [], related: [] };
    const port = (bucket: string) => ({
      retrieveEntity: vi.fn(async (id: number) => {
        calls[bucket].push(id);
        return { id };
      }),
    });
    const ports = { color: port("color"), material: port("material"), pattern: port("pattern"), tag: port("tag") };
    const service = new FinishedProductService(
      {
        retrieveEntity: vi.fn(async () => null),
        findByProductId: vi.fn(async () => null),
      } as never,
      {
        retrieveProduct: vi.fn(async () => productRow),
        findProductBySlug: vi.fn(async (slug: string) => (slug === productRow.slug ? productRow : null)),
      } as never,
      ports.color as never,
      ports.material as never,
      ports.pattern as never,
      ports.tag as never,
      { prepareRelatedProductList: vi.fn(async (id: number) => { calls.related.push(id); return []; }) } as never,
      { prepareSizeProfile: vi.fn(async (id: number) => { calls.sizeProfile.push(id); return { id }; }) } as never,
      {} as never,
      {} as never,
      {} as never,
    );
    return { service, calls };
  }

  it("looks each entity up by its own id, not the product id", async () => {
    const { service, calls } = build();
    await service.retrieveFinishedProductBySlug(productRow.slug);

    expect(calls.color).toEqual([2703]);
    expect(calls.material).toEqual([2570]);
    expect(calls.pattern).toEqual([2747, 2737, 33945134]);
    expect(calls.sizeProfile).toEqual([57424]);
    // Only the related-product list is genuinely keyed by the product id.
    expect(calls.related).toEqual([PRODUCT_ID]);
    for (const bucket of ["color", "material", "pattern", "sizeProfile"]) {
      expect(calls[bucket]).not.toContain(PRODUCT_ID);
    }
  });

  it("returns each list as an array, and an empty csv as an empty list", async () => {
    const { service } = build();
    const result = (await service.retrieveFinishedProductBySlug(productRow.slug)) as Record<string, unknown>;
    expect(result.colors).toEqual([{ id: 2703 }]);
    expect(result.patterns).toHaveLength(3);
    expect(result.tags).toEqual([]); // tag_id is ''
    expect(result.sizeProfile).toEqual({ id: 57424 });
  });

  it("exposes the product row under both `product` and `productPreview`", async () => {
    const { service } = build();
    const result = (await service.retrieveFinishedProductBySlug(productRow.slug)) as Record<string, unknown>;
    expect(result.product).toBe(productRow);
    expect(result.productPreview).toBe(productRow);
  });

  it("returns null for an unknown slug", async () => {
    const { service } = build();
    await expect(service.retrieveFinishedProductBySlug("no-such-slug")).resolves.toBeNull();
  });

  it("treats an id past 2^53 as a miss rather than rounding it into another row", async () => {
    const { service } = build();
    await expect(service.retrieveFinishedProduct(9007199254740993n)).resolves.toBeNull();
  });
});
