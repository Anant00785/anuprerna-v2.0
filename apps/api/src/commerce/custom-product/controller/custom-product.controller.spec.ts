/**
 * Response envelopes for the four custom-product routes. The keys
 * `customProduct` / `customProductList` are Loom's ResponseParameter constants
 * and are read verbatim by apps/cms/src/lib/custom-products-api.ts.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { CustomProductController } from "./custom-product.controller.js";
import type { CustomProductService } from "../service/custom-product.service.js";

const PRODUCT = {
  id: 1n,
  name: "Handwoven Cotton Stole",
  sku: "AP-CP-0001",
  price: "1250.00",
  productGroup: "fabric",
  unit: "METER",
};

function make(over: Partial<Record<keyof CustomProductService, unknown>> = {}) {
  const service = {
    getCustomProducts: vi.fn().mockResolvedValue([]),
    getCustomProduct: vi.fn().mockResolvedValue(null),
    addCustomProduct: vi.fn().mockResolvedValue(true),
    updateCustomProduct: vi.fn().mockResolvedValue(true),
    ...over,
  };
  return { service, controller: new CustomProductController(service as unknown as CustomProductService) };
}

const body = (over: Record<string, unknown> = {}) =>
  ({ name: "Stole", sku: "AP-1", price: 100, productGroup: "fabric", ...over }) as never;

describe("GET /get/custom-product", () => {
  it("returns the list under `customProductList`", async () => {
    const { controller } = make({ getCustomProducts: vi.fn().mockResolvedValue([PRODUCT]) });
    await expect(controller.getCustomProducts()).resolves.toEqual({
      success: true,
      message: "",
      customProductList: [PRODUCT],
    });
  });

  it("returns an empty list rather than an error when there are none", async () => {
    const { controller } = make();
    await expect(controller.getCustomProducts()).resolves.toEqual({
      success: true,
      message: "",
      customProductList: [],
    });
  });
});

describe("GET /get/custom-product/:productId", () => {
  it("returns the row under `customProduct`", async () => {
    const { controller, service } = make({ getCustomProduct: vi.fn().mockResolvedValue(PRODUCT) });
    await expect(controller.getCustomProduct("1")).resolves.toEqual({
      success: true,
      message: "",
      customProduct: PRODUCT,
    });
    expect(service.getCustomProduct).toHaveBeenCalledWith(1);
  });

  it("returns customProduct: null for an id that does not exist", async () => {
    const { controller } = make();
    await expect(controller.getCustomProduct("999")).resolves.toEqual({
      success: true,
      message: "",
      customProduct: null,
    });
  });

  it("rejects a non-numeric id instead of querying with NaN", async () => {
    const { controller, service } = make();
    await expect(controller.getCustomProduct("abc")).rejects.toThrow(BadRequestException);
    expect(service.getCustomProduct).not.toHaveBeenCalled();
  });
});

describe("POST /add/custom-product", () => {
  it("creates and reports success", async () => {
    const { controller, service } = make();
    await expect(controller.addCustomProduct(body())).resolves.toEqual({
      success: true,
      message: "New custom product created.",
    });
    expect(service.addCustomProduct).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Stole", sku: "AP-1", productGroup: "fabric", unit: "METER" }),
    );
  });

  it("derives unit UNIT for the finished group, as Loom's create form does", async () => {
    const { controller, service } = make();
    await controller.addCustomProduct(body({ productGroup: "finished" }));
    expect(service.addCustomProduct).toHaveBeenCalledWith(expect.objectContaining({ unit: "UNIT" }));
  });

  it("reports failure rather than a silent success when the insert returns nothing", async () => {
    const { controller } = make({ addCustomProduct: vi.fn().mockResolvedValue(false) });
    await expect(controller.addCustomProduct(body())).resolves.toEqual({
      success: false,
      message: "Failed to create custom product.",
    });
  });

  it("rejects a missing name before touching the service", async () => {
    const { controller, service } = make();
    await expect(controller.addCustomProduct(body({ name: "" }))).resolves.toEqual({
      success: false,
      message: "Name is required.",
    });
    expect(service.addCustomProduct).not.toHaveBeenCalled();
  });
});

describe("PATCH /update/custom-product", () => {
  it("updates by the body id and reports success", async () => {
    const { controller, service } = make();
    await expect(controller.updateCustomProduct(body({ id: 7 }))).resolves.toEqual({
      success: true,
      message: "Custom product updated.",
    });
    expect(service.updateCustomProduct).toHaveBeenCalledWith(7, expect.objectContaining({ id: 7 }));
  });

  it("reports failure when the id matches no row (Loom's NO_ACTION)", async () => {
    const { controller } = make({ updateCustomProduct: vi.fn().mockResolvedValue(false) });
    await expect(controller.updateCustomProduct(body({ id: 999 }))).resolves.toEqual({
      success: false,
      message: "Failed to update custom product.",
    });
  });

  it("rejects a missing id before touching the service", async () => {
    const { controller, service } = make();
    await expect(controller.updateCustomProduct(body())).resolves.toEqual({
      success: false,
      message: "Custom product id is required.",
    });
    expect(service.updateCustomProduct).not.toHaveBeenCalled();
  });
});
