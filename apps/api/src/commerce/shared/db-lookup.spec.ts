import { describe, it, expect, vi } from "vitest";
import * as schema from "../../database/schema/schema.js";
import { lookupById, lookupByIds, lookupIdById } from "./db-lookup.js";

/**
 * Minimal drizzle-shaped double: every builder method returns the chain,
 * and the chain is thenable so both `await chain` and `await chain.limit(1)`
 * resolve to `rows`. Enough to prove the helpers issue a real query and
 * hand back the real rows — not a hardcoded null.
 */
function fakeDb(rows: unknown[]) {
  const calls: Record<string, unknown[]> = { from: [], where: [] };
  const chain: any = {
    calls,
    select: vi.fn(() => chain),
    from: vi.fn((t: unknown) => {
      calls.from.push(t);
      return chain;
    }),
    where: vi.fn((w: unknown) => {
      calls.where.push(w);
      return chain;
    }),
    limit: vi.fn(() => Promise.resolve(rows)),
    then: (onOk: any, onErr: any) => Promise.resolve(rows).then(onOk, onErr),
  };
  return chain;
}

describe("lookupById", () => {
  it("selects from the table it was given and returns the real row", async () => {
    const row = { id: 42n, profileName: "Selvedge", displayName: "Finish" };
    const db = fakeDb([row]);

    const result = await lookupById(db, schema.finishProfile)(42);

    expect(result).toBe(row);
    expect(db.calls.from[0]).toBe(schema.finishProfile);
    expect(db.select).toHaveBeenCalled();
  });

  it("returns null when the row genuinely does not exist", async () => {
    expect(await lookupById(fakeDb([]), schema.finishProfile)(9999)).toBeNull();
  });
});

describe("lookupIdById", () => {
  it("narrows a real row to `{ id }` with a JS number id", async () => {
    const result = await lookupIdById(fakeDb([{ id: 7n, name: "x" }]), schema.badgeProfile)(7);
    expect(result).toEqual({ id: 7 });
  });

  it("returns null, not `{ id: NaN }`, when nothing matched", async () => {
    expect(await lookupIdById(fakeDb([]), schema.badgeProfile)(7)).toBeNull();
  });
});

describe("lookupByIds", () => {
  it("returns every matching row", async () => {
    const rows = [{ id: 1n }, { id: 2n }];
    expect(await lookupByIds(fakeDb(rows), schema.material)([1, 2])).toBe(rows);
  });

  it("short-circuits an empty id list without querying", async () => {
    const db = fakeDb([{ id: 1n }]);
    expect(await lookupByIds(db, schema.material)([])).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });
});
