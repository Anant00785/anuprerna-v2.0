/**
 * apps/api/src/commerce/domain/wishlist.controller.spec.ts
 *
 * PUT/POST /manage/wishlist/:commaSeparatedSkuList used to parse the SKUs,
 * write NOTHING, and answer "Wishlist updated successfully."
 *
 * Java original: CustomerController.manageWishlist -> CustomerDAOController
 * .manageWishlist(tenantFromToken, csv), which sets customer.wishlist = csv.
 * It is a whole-list replace, not an incremental add.
 *
 * The service here runs against a fake `customer` table so an actual write is
 * observable and can be read back.
 */
import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { WishlistDomainController } from "./wishlist.controller.js";
import { CustomerDomainService } from "./customer-domain.service.js";
import type { Database } from "../../database/database.module.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";

const TENANT_A = { id: 7, uid: "u7", email: "a@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;
const TENANT_B = { id: 8, uid: "u8", email: "b@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;
const NO_CUSTOMER_ROW = { id: 99, uid: "u99", email: "c@b.com", roles: ["ROLE_CUSTOMER"] } as AuthenticatedTenant;

/** Every bound parameter inside a Drizzle condition, in order. */
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
 * A `customer` table keyed by tenantId. `update().set().where()` mutates only
 * the rows whose tenantId appears among the condition's bound parameters, so a
 * handler that forgot to scope would visibly clobber both tenants.
 *
 * `insert().values().onConflictDoUpdate()` upserts: a tenant with no row yet
 * gets one created (this is the fix — replaceWishlist used to plain UPDATE,
 * so a tenant who had never touched any customer preference had 0 rows
 * affected on every wishlist save, silently, since the route still answered
 * 200. The heart toggled red in the UI; nothing was ever persisted).
 */
function fakeCustomerTable(rows: { id: number; tenantId: number; wishlist: string }[]) {
  let nextId = Math.max(0, ...rows.map((r) => r.id)) + 1;
  const match = (cond: unknown) => {
    const bound = boundValues(cond).map(String);
    return rows.filter((r) => bound.includes(String(r.tenantId)));
  };
  const db = {
    update: () => ({
      set: (values: { wishlist: string }) => ({
        where: (cond: unknown) => ({
          returning: async () => {
            const hit = match(cond);
            for (const row of hit) row.wishlist = values.wishlist;
            return hit.map((r) => ({ id: r.id }));
          },
        }),
      }),
    }),
    insert: () => ({
      values: (values: { tenantId: number; wishlist: string }) => ({
        onConflictDoUpdate: async () => {
          const existing = rows.find((r) => r.tenantId === values.tenantId);
          if (existing) {
            existing.wishlist = values.wishlist;
          } else {
            rows.push({ id: nextId++, tenantId: values.tenantId, wishlist: values.wishlist });
          }
        },
      }),
    }),
    select: () => ({
      from: () => ({
        where: (cond: unknown) => ({
          limit: async (n: number) => match(cond).slice(0, n).map((r) => ({ wishlist: r.wishlist })),
        }),
      }),
    }),
  } as unknown as Database;
  return { db, rows };
}

function make() {
  const store = fakeCustomerTable([
    { id: 1, tenantId: 7, wishlist: "" },
    { id: 2, tenantId: 8, wishlist: "TENANT-B-SKU" },
  ]);
  const customers = new CustomerDomainService(store.db);
  return { store, customers, controller: new WishlistDomainController(customers) };
}

describe.each(["putManageWishlist", "postManageWishlist"] as const)("%s", (handler) => {
  it("actually persists the list and reads it back", async () => {
    const { controller, customers, store } = make();

    await expect(controller[handler]("DAN1200452,CAK061SB10", TENANT_A)).resolves.toEqual({
      success: true,
      message: "Wishlist updated successfully.",
    });

    // Read back through the service — the row really changed.
    await expect(customers.getWishlist(7)).resolves.toBe("DAN1200452,CAK061SB10");
    expect(store.rows.find((r) => r.tenantId === 7)?.wishlist).toBe("DAN1200452,CAK061SB10");
  });

  it("is a whole-list replace, as Loom's customer.setWishlist(csv) is", async () => {
    const { controller, customers } = make();
    await controller[handler]("A,B", TENANT_A);
    await controller[handler]("C", TENANT_A);
    await expect(customers.getWishlist(7)).resolves.toBe("C");
  });

  it("normalises separator whitespace before storing", async () => {
    const { controller, customers } = make();
    await controller[handler](" A , B ,, C ", TENANT_A);
    await expect(customers.getWishlist(7)).resolves.toBe("A,B,C");
  });

  it("IDOR: tenant A cannot modify tenant B's wishlist", async () => {
    const { controller, customers, store } = make();

    await controller[handler]("A-ONLY", TENANT_A);

    // Tenant B's row is untouched — the route carries no customer id at all,
    // so the only reachable row is the caller's own.
    await expect(customers.getWishlist(8)).resolves.toBe("TENANT-B-SKU");
    expect(store.rows.find((r) => r.tenantId === 8)?.wishlist).toBe("TENANT-B-SKU");
    // And tenant B writing does not disturb tenant A.
    await controller[handler]("B-ONLY", TENANT_B);
    await expect(customers.getWishlist(7)).resolves.toBe("A-ONLY");
    await expect(customers.getWishlist(8)).resolves.toBe("B-ONLY");
  });

  // Regression: this used to plain UPDATE customer.wishlist, so a tenant with
  // no customer row yet (anyone who had never touched a currency/whatsapp
  // preference — i.e. most freshly-signed-up accounts) got 0 rows affected on
  // EVERY wishlist save. The route still answered 200 "success", so the UI
  // showed a filled heart while nothing was ever persisted, and the wishlist
  // page read back empty forever. It must create the row on first use.
  it("creates the customer row on first use instead of silently doing nothing", async () => {
    const { controller, customers, store } = make();

    await expect(controller[handler]("A", NO_CUSTOMER_ROW)).resolves.toEqual({
      success: true,
      message: "Wishlist updated successfully.",
    });

    await expect(customers.getWishlist(99)).resolves.toBe("A");
    expect(store.rows.find((r) => r.tenantId === 99)?.wishlist).toBe("A");
  });

  it("rejects an empty list — Loom's StringValidator refuses an empty string", async () => {
    const { controller, customers } = make();
    await expect(controller[handler]("   ", TENANT_A)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller[handler](",,,", TENANT_A)).rejects.toBeInstanceOf(BadRequestException);
    // and nothing was written
    await expect(customers.getWishlist(7)).resolves.toBe("");
  });

  it("rejects a list longer than Loom's 9999-character bound", async () => {
    const { controller } = make();
    await expect(controller[handler]("S".repeat(10_000), TENANT_A)).rejects.toBeInstanceOf(BadRequestException);
  });
});
