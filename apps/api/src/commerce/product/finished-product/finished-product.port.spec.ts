/**
 * Regression suite for the PRODUCT_PORT factory in finished-product.module.ts:
 * createProduct used to invent a name ("Handwoven Finished Product"), a ₹1200
 * price (`|| 1200` also swallowed a genuine 0), sub-category 3527 and SKU
 * group 2576. Required fields reject; 0 is a real price.
 */
import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { FinishedProductModule } from "./finished-product.module.js";
import { PRODUCT_PORT, type ProductPort } from "./types/finished-product.types.js";

function makeDb(returningRows: Array<{ id: bigint }> = [{ id: 77n }]) {
  const values = vi.fn(() => ({ returning: () => Promise.resolve(returningRows) }));
  const insert = vi.fn(() => ({ values }));
  return { db: { insert }, insert, values };
}

function makePort(db: unknown): ProductPort {
  const providers = Reflect.getMetadata("providers", FinishedProductModule) as Array<{
    provide?: symbol;
    useFactory?: (db: unknown) => ProductPort;
  }>;
  const def = providers.find((p) => p?.provide === PRODUCT_PORT);
  if (!def?.useFactory) throw new Error("PRODUCT_PORT provider not found");
  return def.useFactory(db);
}

const valid = {
  name: "A-Line Panel Dress",
  sku: "FIN-001",
  price: 1683,
  subCategoryId: 3531,
  skuGroupId: 4,
};

describe("finished-product PRODUCT_PORT.createProduct", () => {
  it.each(["name", "sku", "price", "subCategoryId", "skuGroupId"])(
    "rejects a product missing %s instead of fabricating it",
    async (field) => {
      const { db, insert } = makeDb();
      const input: Record<string, unknown> = { ...valid };
      delete input[field];
      await expect(makePort(db).createProduct(input)).rejects.toBeInstanceOf(BadRequestException);
      expect(insert).not.toHaveBeenCalled();
    },
  );

  it("a genuine 0 price is persisted as \"0\", never replaced by 1200", async () => {
    const { db, values } = makeDb();
    await makePort(db).createProduct({ ...valid, price: 0 });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ price: "0" }));
  });

  it("persists the real ids it was given", async () => {
    const { db, values } = makeDb();
    const created = await makePort(db).createProduct(valid);
    expect(created).toEqual({ id: 77 });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ name: "A-Line Panel Dress", subCategoryId: 3531, skuGroupId: 4 }),
    );
  });
});
