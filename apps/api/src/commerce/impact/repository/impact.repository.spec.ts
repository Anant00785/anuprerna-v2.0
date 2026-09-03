/**
 * Regression suite for the invented-impact-rows bug: getFactors()/getFactorById()
 * used to return fabricated values (2.50 kg CO2, 90 L water, ...) on BOTH a DB
 * error and an empty table, and addFactor() wrote `tenantId || 1` /
 * `orderId || 1`. An empty table is empty, an error propagates, and an impact
 * record can never be silently attributed to tenant 1.
 */
import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { ImpactRepository } from "./impact.repository.js";

function makeDb(rows: unknown[] | Error) {
  const chain = {
    from: () => chain,
    where: () => chain,
    limit: () => (rows instanceof Error ? Promise.reject(rows) : Promise.resolve(rows)),
  };
  const values = vi.fn(() => ({ returning: () => Promise.resolve([{ id: 1n }]) }));
  return {
    db: { select: () => chain, insert: vi.fn(() => ({ values })) },
    values,
  };
}

describe("ImpactRepository.getFactors", () => {
  it("returns [] for an empty table — never the fabricated FABRIC/FINISHED rows", async () => {
    const { db } = makeDb([]);
    await expect(new ImpactRepository(db).getFactors()).resolves.toEqual([]);
  });

  it("propagates a DB error instead of substituting plausible figures", async () => {
    const { db } = makeDb(new Error("relation \"impact_factor\" does not exist"));
    await expect(new ImpactRepository(db).getFactors()).rejects.toThrow("impact_factor");
  });

  it("returns the persisted rows untouched when they exist", async () => {
    const row = { id: 5n, co2OffsetKg: "0.10" };
    const { db } = makeDb([row]);
    await expect(new ImpactRepository(db).getFactors()).resolves.toEqual([row]);
  });
});

describe("ImpactRepository.getFactorById", () => {
  it("returns null for a missing row — no 2.50 kg CO2 default", async () => {
    const { db } = makeDb([]);
    await expect(new ImpactRepository(db).getFactorById("9")).resolves.toBeNull();
  });

  it("propagates a DB error", async () => {
    const { db } = makeDb(new Error("db down"));
    await expect(new ImpactRepository(db).getFactorById("9")).rejects.toThrow("db down");
  });
});

describe("ImpactRepository.addFactor", () => {
  const valid = {
    tenantId: 42,
    orderId: 7,
    orderItemId: 3,
    productType: "FABRIC",
    calculationStatus: "COMPLETED",
  };

  it.each(["tenantId", "orderId", "orderItemId", "productType", "calculationStatus"])(
    "rejects a missing %s instead of writing a default",
    async (field) => {
      const { db } = makeDb([]);
      const data: Record<string, unknown> = { ...valid };
      delete data[field];
      await expect(new ImpactRepository(db).addFactor(data)).rejects.toBeInstanceOf(BadRequestException);
      expect(db.insert).not.toHaveBeenCalled();
    },
  );

  it("rejects a 0 tenantId — it must never resolve to tenant 1", async () => {
    const { db } = makeDb([]);
    await expect(new ImpactRepository(db).addFactor({ ...valid, tenantId: 0 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("writes the REAL ids it was given", async () => {
    const { db, values } = makeDb([]);
    await new ImpactRepository(db).addFactor({ ...valid });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 42, orderId: 7, orderItemId: 3 }));
  });
});
