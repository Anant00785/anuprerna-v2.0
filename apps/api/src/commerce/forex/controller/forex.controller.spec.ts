/**
 * Response-envelope tests for the forex routes the storefront depends on.
 *
 * The exact response KEYS below are load-bearing: they are Loom's
 * ResponseParameter constants (FOREX_LIST = "forexList",
 * FOREX_EXCHANGE_RATE = "forexExchangeRate",
 * FOREX_EXCHANGE_RATE_LIST = "forexExchangeRateList") and are read verbatim by
 * apps/storefront/src/lib/loom/endpoints.ts and src/stores/currency.store.ts.
 */
import { describe, it, expect, vi } from "vitest";
import { ForexController } from "./forex.controller.js";
import type { ForexService } from "../service/forex.service.js";

function makeController(overrides: Partial<Record<keyof ForexService, unknown>> = {}) {
  const service = {
    getAllExchangeRates: vi.fn().mockResolvedValue([]),
    getLatestExchangeRate: vi.fn().mockResolvedValue(null),
    getExchangeRateByCode: vi.fn().mockResolvedValue(null),
    getAllForexRecords: vi.fn().mockResolvedValue([]),
    updateExchangeRate: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
  return { service, controller: new ForexController(service as unknown as ForexService) };
}

describe("ForexController — /get/forex-list", () => {
  it("returns the Loom envelope keyed `forexList`", async () => {
    const rows = [{ id: "1", version: 0, country: "United States", currency: "USD", rate: 1.25 }];
    const { controller, service } = makeController({ getAllForexRecords: vi.fn().mockResolvedValue(rows) });

    await expect(controller.getForexList()).resolves.toEqual({
      success: true,
      message: "",
      forexList: rows,
    });
    expect(service.getAllForexRecords).toHaveBeenCalledOnce();
  });

  it("returns an empty forexList (not an error) when the table is empty", async () => {
    const { controller } = makeController({ getAllForexRecords: vi.fn().mockResolvedValue([]) });
    await expect(controller.getForexList()).resolves.toEqual({ success: true, message: "", forexList: [] });
  });
});

describe("ForexController — /get/forex-exchange-rate/latest", () => {
  it("returns the Loom envelope keyed `forexExchangeRate`", async () => {
    const row = { id: "9", version: 1, recordDate: 1700000000000, gbp: 0.0078, eur: 0.0091, usd: 0.0104 };
    const { controller, service } = makeController({ getLatestExchangeRate: vi.fn().mockResolvedValue(row) });

    await expect(controller.getLatestExchangeRate()).resolves.toEqual({
      success: true,
      message: "",
      forexExchangeRate: row,
    });
    expect(service.getLatestExchangeRate).toHaveBeenCalledOnce();
  });

  it("returns forexExchangeRate: null when no rate row exists", async () => {
    const { controller } = makeController({ getLatestExchangeRate: vi.fn().mockResolvedValue(null) });
    await expect(controller.getLatestExchangeRate()).resolves.toEqual({
      success: true,
      message: "",
      forexExchangeRate: null,
    });
  });
});

describe("ForexController — /get/forex-exchange-rate-list", () => {
  it("returns the Loom envelope keyed `forexExchangeRateList`", async () => {
    const rows = [{ id: "1", recordDate: 1, gbp: 1, eur: 2, usd: 3 }];
    const { controller } = makeController({ getAllExchangeRates: vi.fn().mockResolvedValue(rows) });
    await expect(controller.getExchangeRates()).resolves.toEqual({
      success: true,
      message: "",
      forexExchangeRateList: rows,
    });
  });

  it("returns an empty list when there is no history", async () => {
    const { controller } = makeController();
    await expect(controller.getExchangeRates()).resolves.toEqual({
      success: true,
      message: "",
      forexExchangeRateList: [],
    });
  });
});

describe("ForexController — /get/data-dump/forex (CODE_SU)", () => {
  it("dumps the forex table keyed `forexList`", async () => {
    const rows = [{ id: "1", version: 0, country: "India", currency: "INR", rate: 1 }];
    const { controller } = makeController({ getAllForexRecords: vi.fn().mockResolvedValue(rows) });
    await expect(controller.getForexDataDump()).resolves.toEqual({
      success: true,
      message: "",
      forexList: rows,
    });
  });
});
