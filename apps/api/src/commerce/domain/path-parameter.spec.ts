/**
 * apps/api/src/commerce/domain/path-parameter.spec.ts
 *
 * Regression for the commerce/domain routes that declared a path parameter and
 * then ignored it, answering 200 with an arbitrary `SELECT * FROM <table>
 * LIMIT 50`. Each test proves the response actually corresponds to the id that
 * was asked for.
 *
 * The fake database below reads the bound parameter back out of the Drizzle
 * condition, so "the handler filtered by the requested id" is asserted rather
 * than assumed.
 */
import { describe, it, expect, vi } from "vitest";
import { NotImplementedException } from "@nestjs/common";
import type { Database } from "../../database/database.module.js";
import { AddressMigratedDomainController } from "./address-migrated.controller.js";
import { CategoryMigratedDomainController } from "./category-migrated.controller.js";
import { CustomerDomainController } from "./customer.controller.js";
import { ProductMigratedDomainController } from "./product-migrated.controller.js";
import { OrderMigratedDomainController } from "./order-migrated.controller.js";
import { FinishedProductMigratedDomainController } from "./finished-product-migrated.controller.js";
import { ArtisanMigratedDomainController } from "./artisan-migrated.controller.js";
import type { ProductDomainService } from "./product-domain.service.js";
import type { CustomerDomainService } from "./customer-domain.service.js";
import type { OrderDomainService } from "./order-domain.service.js";
import { GatekeeperService } from "../../auth/service/gatekeeper.service.js";

/** Every bound parameter value inside a Drizzle condition, in order. */
function boundValues(node: unknown, seen = new Set<unknown>()): unknown[] {
  if (node === null || typeof node !== "object" || seen.has(node)) return [];
  seen.add(node);
  const out: unknown[] = [];
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === "value" && (typeof value === "bigint" || typeof value === "number" || typeof value === "string")) {
      out.push(value);
    } else {
      out.push(...boundValues(value, seen));
    }
  }
  return out;
}

/**
 * A table of rows keyed by id. `.where(cond)` keeps only the rows whose id
 * appears among the condition's bound parameters — so a handler that forgets
 * to filter gets every row back and the id assertion fails.
 */
function fakeDb(rowsById: Record<string, Record<string, unknown>>) {
  const all = Object.entries(rowsById).map(([id, row]) => ({ id: BigInt(id), ...row }));
  const chain = (rows: typeof all) => ({
    from: () => chain(rows),
    where: (cond: unknown) => {
      const bound = boundValues(cond).map(String);
      return chain(rows.filter((r) => bound.includes(String(r.id))));
    },
    limit: (n: number) => Promise.resolve(rows.slice(0, n)),
    then: (resolve: (v: typeof all) => void) => resolve(rows),
  });
  return { select: () => chain(all) } as unknown as Database;
}

const ROWS = { "1": { label: "one" }, "2": { label: "two" }, "3": { label: "three" } };

const gatekeeper = new GatekeeperService({
  get: (key: string) =>
    ({ AUTH_JWT_SECRET: "test-jwt-secret-not-real", AUTH_PASSWORD_PEPPER: "test-pepper", AUTH_JWT_TTL_SECONDS: 3600 })[
      key
    ],
} as unknown as ConstructorParameters<typeof GatekeeperService>[0]);

const noProducts = {
  getProductPreviewList: vi.fn().mockResolvedValue([]),
  getRelatedProductsByIdCsv: vi.fn().mockResolvedValue([]),
} as unknown as ProductDomainService;

describe("table-explorer *-by-id readers return the ONE requested row", () => {
  it.each([
    [
      "GET /get/table-explorer/data/address/:id",
      () => new AddressMigratedDomainController(fakeDb(ROWS)),
      "get_get_table_explorer_data_address_id" as const,
    ],
    [
      "GET /get/table-explorer/data/blog-content-category/:id",
      () => new CategoryMigratedDomainController(fakeDb(ROWS), noProducts),
      "get_get_table_explorer_data_blog_content_category_id" as const,
    ],
    [
      "GET /get/table-explorer/data/story-content-category/:id",
      () => new CategoryMigratedDomainController(fakeDb(ROWS), noProducts),
      "get_get_table_explorer_data_story_content_category_id" as const,
    ],
    [
      "GET /get/table-explorer/data/customer/:id",
      () => new CustomerDomainController(fakeDb(ROWS), {} as CustomerDomainService),
      "get_get_table_explorer_data_customer_id" as const,
    ],
    [
      "GET /get/table-explorer/data/product-vector/:id",
      () => new ProductMigratedDomainController(fakeDb(ROWS), noProducts),
      "get_get_table_explorer_data_product_vector_id" as const,
    ],
    [
      "GET /get/table-explorer/data/story-product-mapping/:id",
      () => new ProductMigratedDomainController(fakeDb(ROWS), noProducts),
      "get_get_table_explorer_data_story_product_mapping_id" as const,
    ],
    [
      "GET /get/table-explorer/data/order-item/:id",
      () => new OrderMigratedDomainController(fakeDb(ROWS), {} as OrderDomainService, gatekeeper),
      "get_get_table_explorer_data_order_item_id" as const,
    ],
  ])("%s", async (_name, build, handler) => {
    const controller = build() as unknown as Record<string, (id: string) => Promise<unknown>>;

    await expect(controller[handler]("2")).resolves.toEqual({
      success: true,
      message: "",
      data: { id: 2n, label: "two" },
    });
    // A different id must give a different row — not the first of fifty.
    await expect(controller[handler]("3")).resolves.toEqual({
      success: true,
      message: "",
      data: { id: 3n, label: "three" },
    });
    // An id that does not exist must be null, not somebody else's row.
    await expect(controller[handler]("99")).resolves.toEqual({ success: true, message: "", data: null });
  });
});

describe("GET /get/related-products/id/:csv", () => {
  it("passes the csv through and answers keyed `relatedProductsList`", async () => {
    const related = [{ id: 101, products: [] }];
    const products = {
      getProductPreviewList: vi.fn(),
      getRelatedProductsByIdCsv: vi.fn().mockResolvedValue(related),
    } as unknown as ProductDomainService;
    const controller = new ProductMigratedDomainController(fakeDb({}), products);

    await expect(controller.get_get_related_products_id_csv("101,102")).resolves.toEqual({
      success: true,
      message: "",
      relatedProductsList: related,
    });
    expect(products.getRelatedProductsByIdCsv).toHaveBeenCalledWith("101,102");
  });
});

describe("GET /get/product-preview-list/:category", () => {
  it("answers keyed `productPreviewList` (Loom's ResponseParameter), not `data`", async () => {
    const previews = [{ id: 1 }];
    const products = {
      getProductPreviewList: vi.fn().mockResolvedValue(previews),
      getRelatedProductsByIdCsv: vi.fn(),
    } as unknown as ProductDomainService;
    const controller = new CategoryMigratedDomainController(fakeDb({}), products);

    await expect(controller.get_get_product_preview_list_category("saree")).resolves.toEqual({
      success: true,
      message: "",
      productPreviewList: previews,
    });
  });
});

describe("routes with no Java original fail loudly instead of dumping products", () => {
  it("DELETE /delete/finished-product/:productId", async () => {
    const controller = new FinishedProductMigratedDomainController(fakeDb({}));
    await expect(controller.delete_delete_finished_product_productId("1")).rejects.toBeInstanceOf(
      NotImplementedException,
    );
  });

  it("GET /get/master/:masterId/worker/:artisanId/workflow/:workflowId", async () => {
    const controller = new ArtisanMigratedDomainController(fakeDb({}));
    await expect(
      controller.get_get_master_masterId_worker_artisanId_workflow_workflowId("1", "2", "3"),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });

  it("GET /get/master/:masterId/worker/:artisanId/workflow/:workflowId/assigned-element-details", async () => {
    const controller = new ArtisanMigratedDomainController(fakeDb({}));
    await expect(
      controller.get_get_master_masterId_worker_artisanId_workflow_workflowId_assigned_element_details("1", "2", "3"),
    ).rejects.toBeInstanceOf(NotImplementedException);
  });
});
