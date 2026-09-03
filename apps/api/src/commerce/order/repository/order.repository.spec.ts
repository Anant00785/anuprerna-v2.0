/**
 * OrderRepository — the write paths that move money and order state.
 *
 * Authority for every assertion below is the Java original at
 * `loom/src/main/java/com/bloomscorp/loom/order/dao/controller/`:
 *   - OrderDAOController.updateOrderStatusToCancelled  (header + item cascade)
 *   - CustomOrderDAOController.updateOrderStatusToCancelled
 *   - CustomOrderDAOController.addOrder                (adjustedTotal default)
 *   - CustomOrderDAOController.retrieveOrder           (findByIdAndTenantAndDeletedFalse)
 *
 * These tests exist because the port had silently changed four of those
 * semantics; see docs/KNOWN-GAPS.md "Fixed" for the write-up.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderRepository } from "./order.repository.js";
import * as schema from "../../../database/schema/schema.js";

/** One recorded statement, in the order the repository issued it. */
interface Stmt {
  kind: "select" | "update" | "insert" | "delete";
  table: unknown;
  set?: Record<string, unknown>;
  values?: Record<string, unknown>;
  returning: unknown[];
}

/**
 * A chainable stand-in for the Drizzle builder. Every terminal (`.returning()`,
 * awaiting the builder) resolves to the next queued result. `where`/`limit`/
 * `orderBy`/`offset` are recorded but not interpreted — these tests assert what
 * the repository *writes* and *whether it issues the statement at all*, which is
 * what the ported semantics turn on. Predicate contents are covered by the
 * integration suite against a real Postgres.
 */
function makeDb(results: unknown[][] = []) {
  const stmts: Stmt[] = [];
  const queue = [...results];
  const next = () => (queue.length > 0 ? (queue.shift() as unknown[]) : []);

  const chain = (stmt: Stmt) => {
    const rows = stmt.returning;
    const self: Record<string, unknown> = {};
    for (const m of ["where", "limit", "offset", "orderBy", "from", "innerJoin", "leftJoin"]) {
      self[m] = () => self;
    }
    self.returning = () => Promise.resolve(rows);
    self.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(rows).then(res, rej);
    return self;
  };

  const db = {
    select: (..._a: unknown[]) => {
      const stmt: Stmt = { kind: "select", table: null, returning: next() };
      stmts.push(stmt);
      const c = chain(stmt) as Record<string, unknown>;
      c.from = (t: unknown) => {
        stmt.table = t;
        return c;
      };
      return c;
    },
    update: (t: unknown) => {
      const stmt: Stmt = { kind: "update", table: t, returning: [] };
      return {
        set: (v: Record<string, unknown>) => {
          stmt.set = v;
          stmt.returning = next();
          stmts.push(stmt);
          return chain(stmt);
        },
      };
    },
    insert: (t: unknown) => ({
      values: (v: Record<string, unknown>) => {
        const stmt: Stmt = { kind: "insert", table: t, values: v, returning: next() };
        stmts.push(stmt);
        return chain(stmt);
      },
    }),
    delete: (t: unknown) => {
      const stmt: Stmt = { kind: "delete", table: t, returning: next() };
      stmts.push(stmt);
      return chain(stmt);
    },
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  };

  return { db, stmts };
}

const repoOf = (db: unknown) => new OrderRepository(db as never);

describe("OrderRepository.cancelOrder — Loom updateOrderStatusToCancelled", () => {
  it("stamps cancelledAt + reason on the order AND drives every item to CANCELLED", async () => {
    // Loom cancels the header and then
    //   order.getOrderItems().forEach(oi -> { oi.setOrderStatus(CANCELLED); oi.setUpdatedAt(now); })
    // The item write is what the customer-facing status ladder in
    // findOrderPreviewsByTenant actually reads (`oi.order_status = 'CANCELLED'`).
    const { db, stmts } = makeDb([[{ id: 5n }]]);
    const before = Date.now();
    await repoOf(db).cancelOrder(5n, "Cancelled by user");

    expect(stmts).toHaveLength(2);
    expect(stmts[0].table).toBe(schema.orders);
    expect(stmts[0].set!.cancellationReason).toBe("Cancelled by user");
    expect(stmts[0].set!.cancelledAt as number).toBeGreaterThanOrEqual(before);

    expect(stmts[1].table).toBe(schema.orderItem);
    expect(stmts[1].set!.orderStatus).toBe("CANCELLED");
    expect(stmts[1].set!.updatedAt as number).toBeGreaterThanOrEqual(before);
  });

  it("uses one timestamp for the header and the items", async () => {
    const { db, stmts } = makeDb([[{ id: 5n }]]);
    await repoOf(db).cancelOrder(5n, "r");
    expect(stmts[1].set!.updatedAt).toBe(stmts[0].set!.cancelledAt);
  });

  it("returns null and issues NO item write when the order does not exist", async () => {
    // Not-found path: never cascade CANCELLED onto order_item rows whose parent
    // order was not actually cancelled.
    const { db, stmts } = makeDb([[]]);
    await expect(repoOf(db).cancelOrder(404n, "r")).resolves.toBeNull();
    expect(stmts).toHaveLength(1);
  });

  it("propagates a DB error rather than reporting a successful cancel", async () => {
    const db = {
      update: () => ({
        set: () => ({ where: () => ({ returning: () => Promise.reject(new Error("boom")) }) }),
      }),
    };
    await expect(repoOf(db).cancelOrder(5n, "r")).rejects.toThrow("boom");
  });
});

describe("OrderRepository.deleteOrder / deleteCustomOrder — soft delete", () => {
  it("deleteOrder marks orders.deleted instead of issuing a DELETE", async () => {
    // Loom's finders are all `...AndDeletedFalse`, and `orders.deleted` is
    // NOT NULL DEFAULT false in the introspected schema. A hard DELETE would
    // also break stripe_transaction.fk_loom_order_id.
    const { db, stmts } = makeDb([[{ id: 5n }]]);
    const row = await repoOf(db).deleteOrder(5n);

    expect(stmts.map((s) => s.kind)).toEqual(["update"]);
    expect(stmts[0].table).toBe(schema.orders);
    expect(stmts[0].set).toEqual({ deleted: true });
    expect(row).toEqual({ id: 5n });
  });

  it("deleteOrder returns null for an unknown or already-deleted order", async () => {
    const { db } = makeDb([[]]);
    await expect(repoOf(db).deleteOrder(404n)).resolves.toBeNull();
  });

  it("deleteCustomOrder marks custom_order.deleted and reports a boolean", async () => {
    const { db, stmts } = makeDb([[{ id: 9n }]]);
    await expect(repoOf(db).deleteCustomOrder(9n)).resolves.toBe(true);
    expect(stmts[0].kind).toBe("update");
    expect(stmts[0].table).toBe(schema.customOrder);
    expect(stmts[0].set).toEqual({ deleted: true });
  });

  it("deleteCustomOrder is false when nothing matched", async () => {
    const { db } = makeDb([[]]);
    await expect(repoOf(db).deleteCustomOrder(404n)).resolves.toBe(false);
  });
});

describe("OrderRepository.cancelCustomOrder — tenant scoping", () => {
  it("cascades CANCELLED to custom_order_item on success", async () => {
    const { db, stmts } = makeDb([[{ id: 9n }]]);
    await expect(repoOf(db).cancelCustomOrder(9n, 42)).resolves.toBe(true);
    expect(stmts).toHaveLength(2);
    expect(stmts[1].table).toBe(schema.customOrderItem);
    expect(stmts[1].set!.orderStatus).toBe("CANCELLED");
  });

  it("returns false and writes nothing when the order is not the tenant's", async () => {
    // The tenant predicate is in the WHERE clause, so a foreign order matches
    // zero rows — and crucially the item cascade must not run either.
    const { db, stmts } = makeDb([[]]);
    await expect(repoOf(db).cancelCustomOrder(9n, 42)).resolves.toBe(false);
    expect(stmts).toHaveLength(1);
  });

  it.each([0, -1, Number.NaN])(
    "refuses to issue any statement for the unusable tenant id %p",
    async (tenantId) => {
      // Previously `tenantId` was accepted and then dropped on the floor, so any
      // authenticated tenant could cancel any custom order by id.
      const { db, stmts } = makeDb();
      await expect(repoOf(db).cancelCustomOrder(9n, tenantId)).resolves.toBe(false);
      expect(stmts).toHaveLength(0);
    },
  );
});

describe("OrderRepository.createCustomOrder — money", () => {
  const order = [{ id: 9n }];

  it("totals the payload exactly: sum(price * quantity), with no invented floor", async () => {
    const { db, stmts } = makeDb([order, [], []]);
    await repoOf(db).createCustomOrder(42, {
      orderItemList: [
        { price: 250, quantity: 4 },
        { price: 100, quantity: 1 },
      ],
    });
    const header = stmts[0].values!;
    expect(header.subTotal).toBe("1100");
    expect(header.total).toBe("1100");
  });

  it("sets adjustedTotal to the order total (Loom addOrder), not the column default 0", async () => {
    // Loom: `if (adjustedTotal == null || adjustedTotal == 0) adjustedTotal = total`.
    // Every later adjustment is `adjustedTotal + delta`, so leaving it at the
    // column's '0' default understates the order by its own total forever.
    const { db, stmts } = makeDb([order, []]);
    await repoOf(db).createCustomOrder(42, { orderItemList: [{ price: 500, quantity: 2 }] });
    expect(stmts[0].values!.adjustedTotal).toBe("1000");
  });

  it("keeps a genuinely zero-value order at zero", async () => {
    // Regression: the port used to do `if (subTotal === 0) subTotal = 1500`,
    // silently billing 1500 for an order the customer priced at nothing.
    const { db, stmts } = makeDb([order, []]);
    await repoOf(db).createCustomOrder(42, { orderItemList: [{ price: 0, quantity: 3 }] });
    expect(stmts[0].values!.subTotal).toBe("0");
    expect(stmts[0].values!.total).toBe("0");
    expect(stmts[0].values!.adjustedTotal).toBe("0");
  });

  it("writes a zero-priced item as 0, not as a fabricated 1500", async () => {
    // `String(item.price || 1500)` turned a 0 into 1500 on the item row too.
    const { db, stmts } = makeDb([order, []]);
    await repoOf(db).createCustomOrder(42, { orderItemList: [{ price: 0, quantity: 0 }] });
    const item = stmts[1].values!;
    expect(item.price).toBe("0");
    expect(item.quantity).toBe("0");
  });

  it("an empty item list produces a zero-total order, not a 1500 one", async () => {
    const { db, stmts } = makeDb([order]);
    await repoOf(db).createCustomOrder(42, { orderItemList: [] });
    expect(stmts[0].values!.subTotal).toBe("0");
    expect(stmts).toHaveLength(1);
  });

  it("carries Loom's per-item defaults: PROCESSING status and MADE_TO_ORDER type", async () => {
    // Loom addOrder: `orderItem.setOrderStatus(ORDER_STATUS.PROCESSING)`.
    const { db, stmts } = makeDb([order, []]);
    await repoOf(db).createCustomOrder(42, { orderItemList: [{ price: 1, quantity: 1 }] });
    const item = stmts[1].values!;
    expect(item.orderStatus).toBe("PROCESSING");
    expect(item.orderType).toBe("MADE_TO_ORDER");
    expect(item.unit).toBe("METER");
    expect(item.currency).toBe("INR");
  });

  it.each([0, -1, Number.NaN])("refuses an unusable tenant id %p rather than defaulting to tenant 1", async (tid) => {
    const { db, stmts } = makeDb();
    await expect(repoOf(db).createCustomOrder(tid, { orderItemList: [] })).rejects.toThrow(
      /positive tenant id/,
    );
    expect(stmts).toHaveLength(0);
  });
});

describe("OrderRepository tenant-scoped reads", () => {
  beforeEach(() => vi.restoreAllMocks());

  it.each([0, -1, Number.NaN])(
    "findByCustomerIdPaginated returns [] for tenant id %p instead of serving tenant 1",
    async (tid) => {
      const { db, stmts } = makeDb();
      await expect(repoOf(db).findByCustomerIdPaginated(tid, 0, 10)).resolves.toEqual([]);
      expect(stmts).toHaveLength(0);
    },
  );

  it.each([0, -1, Number.NaN])(
    "findCustomOrdersByTenant returns [] for tenant id %p instead of serving tenant 1",
    async (tid) => {
      const { db, stmts } = makeDb();
      await expect(repoOf(db).findCustomOrdersByTenant(tid)).resolves.toEqual([]);
      expect(stmts).toHaveLength(0);
    },
  );

  it("findById returns null when the order is absent, without reading order_item", async () => {
    const { db, stmts } = makeDb([[]]);
    await expect(repoOf(db).findById(404n)).resolves.toBeNull();
    expect(stmts).toHaveLength(1);
  });

  it("findCustomOrderById returns null when absent, without reading custom_order_item", async () => {
    const { db, stmts } = makeDb([[]]);
    await expect(repoOf(db).findCustomOrderById(404n)).resolves.toBeNull();
    expect(stmts).toHaveLength(1);
  });

  it("findById attaches orderItemList to the order it found", async () => {
    const { db } = makeDb([[{ id: 5n }], [{ id: 1n }, { id: 2n }]]);
    await expect(repoOf(db).findById(5n)).resolves.toEqual({
      id: 5n,
      orderItemList: [{ id: 1n }, { id: 2n }],
    });
  });
});
