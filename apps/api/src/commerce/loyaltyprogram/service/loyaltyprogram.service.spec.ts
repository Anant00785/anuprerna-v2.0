/**
 * Co-located specs for every loyalty money path.
 *
 * Loom's loyalty program is a per-customer discount configuration, not a points
 * ledger — "award" is enableLoyaltyProgram/onboard, "redeem" is the adjustment
 * that rewrites the discount terms, and "balance" is the membership info a
 * customer reads back. Each of those is covered here against the Java envelope,
 * plus the zero/boundary values, a failed write leaving no partial state, and
 * the cross-tenant read.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { LoyaltyprogramService } from "./loyaltyprogram.service.js";
import type { LoyaltyprogramRepository } from "../repository/loyaltyprogram.repository.js";
import {
  LoyaltyConfigAuditLogType,
  type LoyaltyProgramConfigData,
  type LoyaltyProgramConfigInput,
} from "../types/loyaltyprogram.types.js";

const CUSTOMER_A = 101;
const CUSTOMER_B = 202;
const TENANT_A = 11;
const TENANT_B = 22;

function config(overrides: Partial<LoyaltyProgramConfigData> = {}): LoyaltyProgramConfigData {
  return {
    id: "900",
    version: 3,
    customerId: CUSTOMER_A,
    minOrderValueCurrency: "INR",
    minOrderValue: 50000,
    minOrderValueInr: 50000,
    exchangeRate: 1,
    tenure: 1,
    discountPercentage: 10,
    startDate: 1_700_000_000_000,
    endDate: 1_702_592_000_000,
    active: true,
    createdAt: 1_700_000_000_000,
    updatedAt: null,
    ...overrides,
  };
}

function input(overrides: Partial<LoyaltyProgramConfigInput> = {}): LoyaltyProgramConfigInput {
  return {
    id: null,
    customerId: CUSTOMER_A,
    minOrderValueCurrency: "INR",
    minOrderValue: 50000,
    minOrderValueInr: 50000,
    exchangeRate: 1,
    tenure: 1,
    discountPercentage: 10,
    active: true,
    type: LoyaltyConfigAuditLogType.ONBOARDING,
    ...overrides,
  };
}

interface Options {
  existingById?: LoyaltyProgramConfigData | null;
  existingByCustomer?: Record<number, LoyaltyProgramConfigData | null>;
  customerForTenant?: Record<number, number | null>;
  customerExists?: boolean;
  updateReturnsNull?: boolean;
  insertThrows?: Error;
}

function make(options: Options = {}) {
  const inserted: unknown[] = [];
  const updated: unknown[] = [];

  const repo = {
    customerExists: vi.fn(async () => options.customerExists ?? true),
    getConfigById: vi.fn(async () => options.existingById ?? null),
    getConfigByCustomerId: vi.fn(async (id: number) =>
      options.existingByCustomer?.[id] ?? null,
    ),
    getCustomerIdForTenant: vi.fn(async (tenantId: number) =>
      options.customerForTenant?.[tenantId] ?? null,
    ),
    getMembershipInfo: vi.fn(async (customerId: number) => {
      const c = options.existingByCustomer?.[customerId];
      if (!c) return null;
      return {
        tenantId: c.customerId,
        active: c.active,
        programEnrollmentDateEpochMS: c.createdAt,
        currentCycleStartDateEpochMS: c.startDate,
        currentCycleEndDateEpochMS: c.endDate,
        tenureMonths: c.tenure,
        minimumOrderValueCurrency: c.minOrderValueCurrency,
        minimumOrderValue: c.minOrderValue,
        minimumOrderValueINR: c.minOrderValueInr,
        exchangeRate: c.exchangeRate,
        percentileDiscount: c.discountPercentage,
      };
    }),
    insertConfig: vi.fn(
      async (i: LoyaltyProgramConfigInput, startDate: number, endDate: number, now: number) => {
        if (options.insertThrows) throw options.insertThrows;
        inserted.push({ ...i, startDate, endDate, now });
        return config({ ...i, id: "901", version: 1, startDate, endDate, createdAt: now, updatedAt: null });
      },
    ),
    updateConfig: vi.fn(
      async (
        id: bigint,
        version: number,
        i: LoyaltyProgramConfigInput,
        startDate: number,
        endDate: number,
        now: number,
      ) => {
        if (options.updateReturnsNull) return null;
        updated.push({ version, ...i, startDate, endDate, now });
        return config({ ...i, id: String(id), version: version + 1, startDate, endDate, updatedAt: now });
      },
    ),
    getConfigPage: vi.fn(async () => []),
    getAuditLogById: vi.fn(async () => null),
    getAuditLogPage: vi.fn(async () => []),
    findCustomerLoyaltyProgramOrders: vi.fn(async () => []),
    findCustomerLoyaltyProgramCustomOrders: vi.fn(async () => []),
  } satisfies Partial<Record<keyof LoyaltyprogramRepository, unknown>>;

  return {
    repo,
    inserted,
    updated,
    service: new LoyaltyprogramService(repo as unknown as LoyaltyprogramRepository),
  };
}

describe("LoyaltyprogramService — onboarding (award)", () => {
  it("onboards a new program with the caller's exact money terms", async () => {
    const { service, inserted } = make();
    const result = await service.enableLoyaltyProgram(input());

    expect(inserted).toHaveLength(1);
    expect(result.minOrderValue).toBe(50000);
    expect(result.discountPercentage).toBe(10);
    expect(result.active).toBe(true);
  });

  it("derives endDate as startDate + tenure * 30 days, as Java does", async () => {
    const { service } = make();
    const result = await service.enableLoyaltyProgram(input({ tenure: 3 }));
    expect(result.endDate - result.startDate).toBe(3 * 30 * 24 * 60 * 60 * 1000);
  });

  it("rejects an unknown customer instead of fabricating one", async () => {
    const { service, inserted } = make({ customerExists: false });
    await expect(service.enableLoyaltyProgram(input())).rejects.toBeInstanceOf(BadRequestException);
    expect(inserted).toHaveLength(0);
  });

  it("never falls back to 'the newest config in the table' when the id is absent", async () => {
    const { service, repo, inserted, updated } = make({ existingById: null });
    await service.enableLoyaltyProgram(input({ id: null }));
    expect(repo.getConfigPage).not.toHaveBeenCalled();
    expect(updated).toHaveLength(0);
    expect(inserted).toHaveLength(1);
  });
});

describe("LoyaltyprogramService — zero and boundary money values", () => {
  it("persists a genuine 0% discount rather than substituting a default", async () => {
    const { service, inserted } = make();
    const result = await service.enableLoyaltyProgram(input({ discountPercentage: 0 }));
    expect(result.discountPercentage).toBe(0);
    expect((inserted[0] as LoyaltyProgramConfigInput).discountPercentage).toBe(0);
  });

  it("persists a genuine 0 minimum order value", async () => {
    const { service } = make();
    const result = await service.enableLoyaltyProgram(
      input({ minOrderValue: 0, minOrderValueInr: 0 }),
    );
    expect(result.minOrderValue).toBe(0);
    expect(result.minOrderValueInr).toBe(0);
  });

  it("persists a 100% discount at the upper boundary", async () => {
    const { service } = make();
    const result = await service.enableLoyaltyProgram(input({ discountPercentage: 100 }));
    expect(result.discountPercentage).toBe(100);
  });
});

describe("LoyaltyprogramService — adjustment (redeem) and deactivation", () => {
  it("updates an existing config in place, pinned to the version it read", async () => {
    const existing = config({ version: 7 });
    const { service, updated } = make({ existingById: existing });
    await service.enableLoyaltyProgram(
      input({ id: 900n, discountPercentage: 15, type: LoyaltyConfigAuditLogType.ADJUSTMENT }),
    );
    expect(updated).toHaveLength(1);
    expect((updated[0] as { version: number }).version).toBe(7);
  });

  it("deactivates rather than deleting when active is false", async () => {
    const { service } = make({ existingById: config() });
    const result = await service.enableLoyaltyProgram(
      input({ id: 900n, active: false, type: LoyaltyConfigAuditLogType.ADJUSTMENT }),
    );
    expect(result.active).toBe(false);
  });

  it("refuses to repoint an existing config at a different customer", async () => {
    const { service, updated } = make({ existingById: config({ customerId: CUSTOMER_B }) });
    await expect(
      service.enableLoyaltyProgram(input({ id: 900n, customerId: CUSTOMER_A })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updated).toHaveLength(0);
  });

  it("fails loudly instead of replaying when the version moved under it", async () => {
    const { service } = make({ existingById: config(), updateReturnsNull: true });
    await expect(
      service.enableLoyaltyProgram(input({ id: 900n, type: LoyaltyConfigAuditLogType.ADJUSTMENT })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("propagates a failed write rather than reporting success", async () => {
    const { service } = make({ insertThrows: new Error("insert failed") });
    await expect(service.enableLoyaltyProgram(input())).rejects.toThrow("insert failed");
  });
});

describe("LoyaltyprogramService — balance reads are tenant-scoped", () => {
  const options: Options = {
    customerForTenant: { [TENANT_A]: CUSTOMER_A, [TENANT_B]: CUSTOMER_B },
    existingByCustomer: {
      [CUSTOMER_A]: config({ customerId: CUSTOMER_A, discountPercentage: 10 }),
      [CUSTOMER_B]: config({ id: "902", customerId: CUSTOMER_B, discountPercentage: 40 }),
    },
  };

  it("returns the caller's own membership info", async () => {
    const { service } = make(options);
    const info = await service.getCustomerInfo(TENANT_A);
    expect(info.tenantId).toBe(CUSTOMER_A);
    expect(info.percentileDiscount).toBe(10);
  });

  it("tenant A cannot read tenant B's terms — the read is keyed off the resolved tenant only", async () => {
    const { service, repo } = make(options);
    const a = await service.getCustomerInfo(TENANT_A);
    const b = await service.getCustomerInfo(TENANT_B);

    expect(a.percentileDiscount).toBe(10);
    expect(b.percentileDiscount).toBe(40);
    expect(repo.getMembershipInfo).toHaveBeenNthCalledWith(1, CUSTOMER_A);
    expect(repo.getMembershipInfo).toHaveBeenNthCalledWith(2, CUSTOMER_B);
    // No call path exists that lets a caller name the customer id themselves.
    expect(service.getCustomerInfo.length).toBe(1);
  });

  it("rejects a tenant with no customer record instead of returning someone else's config", async () => {
    const { service } = make(options);
    await expect(service.getCustomerInfo(999)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("404s rather than fabricating a Gold tier when the customer has no program", async () => {
    const { service } = make({ customerForTenant: { [TENANT_A]: CUSTOMER_A }, existingByCustomer: {} });
    await expect(service.getCustomerInfo(TENANT_A)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("loyalty order lists are queried by the caller's own tenant id", async () => {
    const { service, repo } = make();
    await service.getCustomerLoyaltyProgramOrders(BigInt(TENANT_A));
    expect(repo.findCustomerLoyaltyProgramOrders).toHaveBeenCalledWith(BigInt(TENANT_A));
    expect(repo.findCustomerLoyaltyProgramCustomOrders).toHaveBeenCalledWith(BigInt(TENANT_A));
  });
});

describe("LoyaltyprogramService — table explorer reads", () => {
  it("404s on a missing config instead of returning an empty object", async () => {
    const { service } = make();
    await expect(service.exploreConfigById(1n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("404s on a missing audit log instead of returning an empty object", async () => {
    const { service } = make();
    await expect(service.exploreAuditLogById(1n)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("passes page and size straight through to the paginated query", async () => {
    const { service, repo } = make();
    await service.exploreConfig(2, 25);
    expect(repo.getConfigPage).toHaveBeenCalledWith(2, 25);
  });
});
