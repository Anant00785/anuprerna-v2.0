/**
 * ForexRepository — the exchange rates every foreign-currency price in the
 * system is derived from.
 *
 * Authority:
 *   loom/.../forex/dao/controller/ForexExchangeRateDAOController.java
 *     retrieveLatestForexExchangeRate ->
 *       findFirstByRecordDateOrderByCreatedAtDesc(
 *         LoomUtility.getDateInMillisecondsWithoutTime(now))
 *   loom/.../forex/service/ForexHelperService.java  (GBP/EUR/USD switch,
 *     `default -> throw new IllegalArgumentException("Unsupported currency")`)
 *   loom/.../order/dao/controller/OrderDAOController.addOrder (the consumer)
 */
import { describe, it, expect, vi } from "vitest";
import { ForexRepository } from "./forex.repository.js";

interface Recorded {
  values?: Record<string, unknown>;
  orderBy: unknown[];
}

function makeDb(selectResults: unknown[][], insertResult: unknown[] = []) {
  const recorded: Recorded[] = [];
  const queue = [...selectResults];

  const selectChain = (rec: Recorded, rowsFn: () => unknown[]) => {
    const self: Record<string, unknown> = {};
    self.from = () => self;
    self.where = () => self;
    self.limit = () => Promise.resolve(rowsFn());
    self.orderBy = (...args: unknown[]) => {
      rec.orderBy = args;
      return self;
    };
    self.then = (r: (v: unknown) => unknown, j?: (e: unknown) => unknown) =>
      Promise.resolve(rowsFn()).then(r, j);
    return self;
  };

  const db = {
    select: () => {
      const rec: Recorded = { orderBy: [] };
      recorded.push(rec);
      return selectChain(rec, () => (queue.length ? (queue.shift() as unknown[]) : []));
    },
    insert: () => ({
      values: (v: Record<string, unknown>) => {
        const rec: Recorded = { values: v, orderBy: [] };
        recorded.push(rec);
        return { returning: () => Promise.resolve(insertResult) };
      },
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
  };

  return { db, recorded, repo: new ForexRepository(db as never) };
}

const snapshot = (over: Record<string, unknown> = {}) => ({
  id: 1n,
  version: 3n,
  recordDate: 1_700_000_000_000,
  gbp: "106.8000",
  eur: "91.2000",
  usd: "83.5000",
  createdAt: 1_700_000_000_000,
  ...over,
});

describe("ForexRepository.findLatestExchangeRate", () => {
  it("returns null when no snapshot exists — it does not invent one", async () => {
    const { repo } = makeDb([[]]);
    await expect(repo.findLatestExchangeRate()).resolves.toBeNull();
  });

  it("parses the numeric columns to numbers, as Loom's entity types them", async () => {
    const { repo } = makeDb([[snapshot()]]);
    await expect(repo.findLatestExchangeRate()).resolves.toEqual({
      id: "1",
      version: 3,
      recordDate: 1_700_000_000_000,
      gbp: 106.8,
      eur: 91.2,
      usd: 83.5,
    });
  });

  it("breaks a same-record-date tie on createdAt, as Loom's finder does", async () => {
    // findFirstByRecordDateOrderByCreatedAtDesc. Ordering on recordDate alone
    // made "the latest rate" non-deterministic whenever two snapshots shared a
    // record date, which is exactly what upsertExchangeRate produces.
    const { repo, recorded } = makeDb([[snapshot()]]);
    await repo.findLatestExchangeRate();
    expect(recorded[0].orderBy).toHaveLength(2);
  });

  it("preserves version 0 instead of reporting it as null", async () => {
    // `version ? Number(version) : null` collapsed a legitimate 0 to null,
    // which is the value optimistic-locking compares against.
    const { repo } = makeDb([[snapshot({ version: 0n })]]);
    const latest = (await repo.findLatestExchangeRate()) as { version: number | null };
    expect(latest.version).toBe(0);
  });

  it("reports a genuine zero rate as 0", async () => {
    const { repo } = makeDb([[snapshot({ usd: "0.0000" })]]);
    const latest = (await repo.findLatestExchangeRate()) as { usd: number };
    expect(latest.usd).toBe(0);
  });
});

describe("ForexRepository.findExchangeRateByCode", () => {
  it.each([
    ["USD", 83.5],
    ["EUR", 91.2],
    ["GBP", 106.8],
  ])("resolves %s to its rate", async (code, rate) => {
    const { repo } = makeDb([[snapshot()]]);
    await expect(repo.findExchangeRateByCode(code)).resolves.toEqual({ currency: code, rate });
  });

  it("is case-insensitive on the currency code", async () => {
    const { repo } = makeDb([[snapshot()]]);
    await expect(repo.findExchangeRateByCode("usd")).resolves.toEqual({ currency: "USD", rate: 83.5 });
  });

  it("returns null when there is no snapshot at all", async () => {
    const { repo } = makeDb([[]]);
    await expect(repo.findExchangeRateByCode("USD")).resolves.toBeNull();
  });

  it("DIVERGENCE FROM LOOM: an unknown code returns the whole snapshot instead of throwing", async () => {
    // ForexHelperService: `default -> throw new IllegalArgumentException(
    // "Unsupported currency: " + exchangeCurrency)`. This port answers with the
    // full three-currency row, so a caller asking for JPY gets a 200 and three
    // irrelevant rates rather than an error. Pinned, not changed: the shape is
    // relied on by the /forex read route. See docs/KNOWN-GAPS.md.
    const { repo } = makeDb([[snapshot()]]);
    const result = (await repo.findExchangeRateByCode("JPY")) as Record<string, unknown>;
    expect(result).not.toHaveProperty("currency");
    expect(result).toMatchObject({ gbp: 106.8, eur: 91.2, usd: 83.5 });
  });

  it.each([[""], [null], [undefined]])("treats %p as an unknown code rather than throwing", async (code) => {
    const { repo } = makeDb([[snapshot()]]);
    await expect(repo.findExchangeRateByCode(code as unknown as string)).resolves.toMatchObject({
      usd: 83.5,
    });
  });
});

describe("ForexRepository.upsertExchangeRate", () => {
  it("carries the two untouched currencies over from the previous snapshot", async () => {
    const { repo, recorded } = makeDb([[snapshot()]], [snapshot({ usd: "84.1000" })]);
    await repo.upsertExchangeRate("USD", 84.1);
    const insert = recorded.find((r) => r.values)!.values!;
    expect(insert).toMatchObject({ usd: "84.1", eur: "91.2000", gbp: "106.8000" });
  });

  it("stamps recordDate at UTC midnight, the key Loom's own reader looks up", async () => {
    // LoomUtility.getDateInMillisecondsWithoutTime. A full millisecond
    // timestamp produced rows findFirstByRecordDate(today) could never match.
    const { repo, recorded } = makeDb([[snapshot()]], [snapshot()]);
    await repo.upsertExchangeRate("EUR", 92);
    const recordDate = recorded.find((r) => r.values)!.values!.recordDate as number;
    expect(recordDate % 86_400_000).toBe(0);
    expect(recordDate).toBeLessThanOrEqual(Date.now());
  });

  it("writes createdAt as a number, matching the bigint({mode:'number'}) column", async () => {
    const { repo, recorded } = makeDb([[snapshot()]], [snapshot()]);
    await repo.upsertExchangeRate("EUR", 92);
    expect(typeof recorded.find((r) => r.values)!.values!.createdAt).toBe("number");
  });

  it("REFUSES to seed invented rates when no snapshot exists", async () => {
    // Regression: this used to write GBP 106.80 / EUR 91.20 / USD 83.50 out of
    // thin air, persisting three fabricated exchange rates into the table every
    // foreign-currency price is derived from.
    const { repo, recorded } = makeDb([[]]);
    await expect(repo.upsertExchangeRate("USD", 84)).rejects.toThrow(/no forex_exchange_rate snapshot/);
    expect(recorded.some((r) => r.values)).toBe(false);
  });

  it.each(["JPY", "", "usdd"])("rejects the unsupported currency %p", async (code) => {
    const { repo, recorded } = makeDb([[snapshot()]]);
    await expect(repo.upsertExchangeRate(code, 84)).rejects.toThrow(/unsupported currency/i);
    expect(recorded).toHaveLength(0);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects the non-positive or non-finite rate %p",
    async (rate) => {
      const { repo, recorded } = makeDb([[snapshot()]]);
      await expect(repo.upsertExchangeRate("USD", rate)).rejects.toThrow(/positive number/);
      expect(recorded).toHaveLength(0);
    },
  );

  it("does not fail the write when the secondary forex-table update throws", async () => {
    // Deliberate in the port: the `forex.rate` mirror update is best-effort.
    const db = {
      select: () => ({
        from: () => ({ orderBy: () => ({ limit: () => Promise.resolve([snapshot()]) }) }),
      }),
      insert: () => ({ values: () => ({ returning: () => Promise.resolve([snapshot()]) }) }),
      update: () => ({ set: () => ({ where: () => Promise.reject(new Error("locked")) }) }),
    };
    const repo = new ForexRepository(db as never);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(repo.upsertExchangeRate("USD", 84)).resolves.not.toBeNull();
    warn.mockRestore();
  });
});

describe("ForexRepository.findAllForexRecords", () => {
  it("returns [] for an empty forex table", async () => {
    const { repo } = makeDb([[]]);
    await expect(repo.findAllForexRecords()).resolves.toEqual([]);
  });

  it("reports a genuine zero rate as 0, not null", async () => {
    const { repo } = makeDb([[{ id: 1n, version: 0n, country: "India", currency: "INR", rate: "0" }]]);
    await expect(repo.findAllForexRecords()).resolves.toEqual([
      { id: "1", version: 0, country: "India", currency: "INR", rate: 0 },
    ]);
  });

  it("reports a null rate as null", async () => {
    const { repo } = makeDb([[{ id: 1n, version: 1n, country: "X", currency: "X", rate: null }]]);
    const [row] = (await repo.findAllForexRecords()) as { rate: number | null }[];
    expect(row.rate).toBeNull();
  });
});
