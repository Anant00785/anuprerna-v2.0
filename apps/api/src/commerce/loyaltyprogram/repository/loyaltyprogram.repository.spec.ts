/**
 * Repository-level specs for the write paths: a failed audit write must leave
 * NO config change behind, and every epoch/id column must be written as a plain
 * number because they are declared `bigint(..., { mode: "number" })`.
 */
import { describe, it, expect, vi } from "vitest";
import { LoyaltyprogramRepository } from "./loyaltyprogram.repository.js";
import {
  LoyaltyConfigAuditLogType,
  type LoyaltyProgramConfigInput,
} from "../types/loyaltyprogram.types.js";

const NOW = 1_700_000_000_000;

function input(overrides: Partial<LoyaltyProgramConfigInput> = {}): LoyaltyProgramConfigInput {
  return {
    id: null,
    customerId: 101,
    minOrderValueCurrency: "INR",
    minOrderValue: 0,
    minOrderValueInr: 0,
    exchangeRate: 1,
    tenure: 1,
    discountPercentage: 0,
    active: true,
    type: LoyaltyConfigAuditLogType.ONBOARDING,
    ...overrides,
  };
}

const insertedConfigRow = {
  id: 900n,
  version: 1n,
  customerId: 101,
  minOrderValueCurrency: "INR",
  minOrderValue: "0.00",
  minOrderValueInr: "0.00",
  exchangeRate: "1.0000",
  tenure: 1,
  discountPercentage: "0.00",
  startDate: NOW,
  endDate: NOW + 1000,
  active: true,
  createdAt: NOW,
  updatedAt: null,
};

/**
 * Minimal drizzle double: records every `.values(...)` payload and models a
 * transaction that discards its writes when the body throws.
 */
function makeDb(options: { failSecondInsert?: boolean; updateReturns?: unknown[] } = {}) {
  const committed: Record<string, unknown>[] = [];

  function tx() {
    const staged: Record<string, unknown>[] = [];
    let insertCount = 0;

    const api = {
      staged,
      insert: () => ({
        values: (v: Record<string, unknown>) => {
          insertCount += 1;
          if (options.failSecondInsert && insertCount === 2) {
            return Promise.reject(new Error("audit insert failed"));
          }
          staged.push(v);
          return {
            returning: () => Promise.resolve([insertedConfigRow]),
            then: (r: (value: unknown) => unknown) => Promise.resolve(undefined).then(r),
          };
        },
      }),
      update: () => ({
        set: (v: Record<string, unknown>) => ({
          where: () => ({
            returning: () => {
              staged.push(v);
              return Promise.resolve(options.updateReturns ?? [insertedConfigRow]);
            },
          }),
        }),
      }),
    };
    return api;
  }

  const db = {
    transaction: vi.fn(async (work: (t: ReturnType<typeof tx>) => Promise<unknown>) => {
      const t = tx();
      const result = await work(t);
      committed.push(...t.staged);
      return result;
    }),
  };

  return { db, committed };
}

function repoOf(db: unknown) {
  return new LoyaltyprogramRepository(
    db as ConstructorParameters<typeof LoyaltyprogramRepository>[0],
  );
}

describe("LoyaltyprogramRepository.insertConfig", () => {
  it("writes epoch and id columns as plain numbers, never BigInt", async () => {
    const { db, committed } = makeDb();
    await repoOf(db).insertConfig(input(), NOW, NOW + 1000, NOW);

    const configValues = committed[0];
    for (const key of ["customerId", "startDate", "endDate", "createdAt"]) {
      expect(typeof configValues[key], `${key} must not be a BigInt`).toBe("number");
    }
    const auditValues = committed[1];
    expect(typeof auditValues.createdAt).toBe("number");
    expect(auditValues.updatedAt).toBeNull();
  });

  it("writes the config and its ONBOARDING audit row in one transaction", async () => {
    const { db, committed } = makeDb();
    await repoOf(db).insertConfig(input(), NOW, NOW + 1000, NOW);
    expect(db.transaction).toHaveBeenCalledOnce();
    expect(committed).toHaveLength(2);
    expect(committed[1].type).toBe(LoyaltyConfigAuditLogType.ONBOARDING);
  });

  it("leaves no partial state when the audit write fails", async () => {
    const { db, committed } = makeDb({ failSecondInsert: true });
    await expect(
      repoOf(db).insertConfig(input(), NOW, NOW + 1000, NOW),
    ).rejects.toThrow("audit insert failed");
    // The config insert was staged but never committed — the previous
    // implementation swallowed this failure and kept the config.
    expect(committed).toHaveLength(0);
  });

  it("serialises a genuine zero discount as '0', not a default", async () => {
    const { db, committed } = makeDb();
    await repoOf(db).insertConfig(input({ discountPercentage: 0, minOrderValue: 0 }), NOW, NOW + 1, NOW);
    expect(committed[0].discountPercentage).toBe("0");
    expect(committed[0].minOrderValue).toBe("0");
  });
});

describe("LoyaltyprogramRepository.updateConfig", () => {
  it("writes no audit row when the program is deactivated", async () => {
    const { db, committed } = makeDb({ updateReturns: [{ ...insertedConfigRow, active: false }] });
    await repoOf(db).updateConfig(900n, 3, input({ active: false }), NOW, NOW + 1, NOW);
    expect(committed).toHaveLength(1);
    expect(committed[0].active).toBe(false);
  });

  it("returns null when the version-pinned update matches nothing", async () => {
    const { db, committed } = makeDb({ updateReturns: [] });
    const result = await repoOf(db).updateConfig(900n, 3, input(), NOW, NOW + 1, NOW);
    expect(result).toBeNull();
    expect(committed.filter((c) => c.type !== undefined)).toHaveLength(0);
  });

  it("writes updatedAt as a number", async () => {
    const { db, committed } = makeDb();
    await repoOf(db).updateConfig(900n, 3, input(), NOW, NOW + 1, NOW);
    expect(typeof committed[0].updatedAt).toBe("number");
  });
});
