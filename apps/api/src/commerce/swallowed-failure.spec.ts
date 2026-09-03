/**
 * apps/api/src/commerce/swallowed-failure.spec.ts
 *
 * Regression suite for the "200 that lies" pattern: a `catch` that turned a
 * FAILED query into `{ success: true, <key>: [] }`, making a broken endpoint
 * indistinguishable from "no data". That is why a broken catalogue endpoint
 * silently rendered an empty storefront for weeks.
 *
 * Every case below asserts BOTH halves of the contract:
 *   1. happy path is byte-identical to the pre-fix payload  (the important half)
 *   2. an infrastructure failure now PROPAGATES (Nest -> 5xx + logs)
 *
 * Genuinely-empty results must still come back as an empty 200 — asserted too.
 */
import { describe, it, expect, vi } from "vitest";
import { FilterController } from "./filter/controller/filter.controller.js";
import type { FilterService } from "./filter/service/filter.service.js";
import type { FilterRepository } from "./filter/repository/filter.repository.js";
import { NavigationController } from "./navigation/controller/navigation.controller.js";
import type { NavigationService } from "./navigation/service/navigation.service.js";
import { CatalogRepository } from "./catalog/repository/catalog.repository.js";
import { CatalogApiController } from "./catalog/controller/catalog.controller.js";
import { CustomerDomainController } from "./domain/customer.controller.js";
import { SuperUserDomainController } from "./domain/super-user.controller.js";
import type { Database } from "../database/database.module.js";
import type { CustomerDomainService } from "./domain/customer-domain.service.js";
import { TableExplorerDomainController } from "./domain/table-explorer.controller.js";
import { WorkflowMigratedDomainController } from "./domain/workflow-migrated.controller.js";
import { ArtisanMigratedDomainController } from "./domain/artisan-migrated.controller.js";
import { ProfilesDomainController } from "./domain/profiles.controller.js";
import { DiscountMigratedDomainController } from "./domain/discount-migrated.controller.js";
import { ContentAiMigratedDomainController } from "./domain/content-ai-migrated.controller.js";
import { CurrencyLocationDomainController } from "./domain/currency-location.controller.js";
import { PaymentMigratedDomainController } from "./domain/payment-migrated.controller.js";
import type { IPLocationService } from "./iplocation/service/iplocation.service.js";

const BOOM = new Error("connection terminated unexpectedly");

/** A drizzle-ish query builder whose terminal await resolves to `rows`. */
function fakeDb(rows: any[] | (() => never)) {
  const chain: any = {};
  for (const m of ["select", "from", "where", "orderBy", "limit", "offset", "insert", "values", "returning", "update", "set", "delete", "onConflictDoUpdate", "groupBy", "leftJoin", "innerJoin"]) {
    chain[m] = () => chain;
  }
  chain.then = (resolve: any, reject: any) => {
    if (typeof rows === "function") return Promise.reject(BOOM).then(resolve, reject);
    return Promise.resolve(rows).then(resolve, reject);
  };
  return chain as unknown as Database;
}

const failingDb = () => fakeDb(() => { throw BOOM; });

// ---------------------------------------------------------------------------
// Storefront catalogue — the highest blast radius (3,150-product PLP).
// ---------------------------------------------------------------------------
describe("FilterController — fabric preview list (storefront PLP)", () => {
  const make = (svc: any, repo: any) =>
    new FilterController(svc as FilterService, repo as FilterRepository);

  it("happy path is unchanged: { success, message, products }", async () => {
    const products = [{ id: 1, slug: "silk" }];
    const c = make({ getFabricFilterPreviewList: async () => products }, {});
    expect(await c.getFabricFilterPreviewList("Fabrics", undefined)).toEqual({
      success: true,
      message: "",
      products,
    });
  });

  it("a genuinely empty catalogue is still a 200 with products: []", async () => {
    const c = make({ getFabricFilterPreviewList: async () => [] }, {});
    expect(await c.getFabricFilterPreviewList("NoSuchCategory", undefined)).toEqual({
      success: true,
      message: "",
      products: [],
    });
  });

  it("a query failure propagates instead of masquerading as an empty catalogue", async () => {
    const c = make({ getFabricFilterPreviewList: async () => { throw BOOM; } }, {});
    await expect(c.getFabricFilterPreviewList("Fabrics", undefined)).rejects.toThrow(BOOM);
  });

  it("/get/fabric-preview-list: happy path unchanged, failure propagates", async () => {
    const products = [{ id: 2 }];
    const ok = make({}, { findFabricFilterPreviewPage: async () => products });
    expect(await ok.getFabricPreviewListAlias(undefined, undefined, undefined, undefined)).toEqual({
      success: true,
      message: "",
      products,
    });

    const bad = make({}, { findFabricFilterPreviewPage: async () => { throw BOOM; } });
    await expect(bad.getFabricPreviewListAlias(undefined, undefined, undefined, undefined)).rejects.toThrow(BOOM);
  });
});

describe("NavigationController — GET /get/navigation (header on every page)", () => {
  it("happy path is unchanged: the service payload is returned verbatim", async () => {
    const menu = { fabric: [{ name: "Craft" }] };
    const c = new NavigationController({ prepareNavigationMenu: async () => menu } as unknown as NavigationService);
    expect(await c.fetchNavigation()).toBe(menu);
  });

  it("a failure propagates rather than serving an empty menu {}", async () => {
    const c = new NavigationController({
      prepareNavigationMenu: async () => { throw BOOM; },
    } as unknown as NavigationService);
    await expect(c.fetchNavigation()).rejects.toThrow(BOOM);
  });
});

// ---------------------------------------------------------------------------
// The repository layer — it swallowed BELOW the controller, so even a correct
// controller could not tell a failure from an empty table.
// ---------------------------------------------------------------------------
describe("CatalogRepository", () => {
  it("findById: happy path unchanged (formatted row), missing row is still null", async () => {
    const repo = new CatalogRepository(fakeDb([{ id: 5n, name: "C", createdAt: 1, updatedAt: 2 }]));
    expect(await repo.findById(5)).toMatchObject({ id: "5", name: "C" });
    expect(await new CatalogRepository(fakeDb([])).findById(5)).toBeNull();
  });

  it("findById: a query failure propagates instead of returning null (= 'not found')", async () => {
    await expect(new CatalogRepository(failingDb()).findById(5)).rejects.toThrow(BOOM);
  });

  it("findAll / findRecent: empty table is still [], query failure propagates", async () => {
    expect(await new CatalogRepository(fakeDb([])).findAll()).toEqual([]);
    expect(await new CatalogRepository(fakeDb([])).findRecent()).toEqual([]);
    await expect(new CatalogRepository(failingDb()).findAll()).rejects.toThrow(BOOM);
    await expect(new CatalogRepository(failingDb()).findRecent()).rejects.toThrow(BOOM);
  });

  it("findAllWithCount: a query failure propagates instead of { rows: [], total: 0 }", async () => {
    await expect(new CatalogRepository(failingDb()).findAllWithCount()).rejects.toThrow(BOOM);
  });

  it("findByArtisan: the no-rows fallback still runs, but a query failure propagates", async () => {
    // Genuine empty -> the recent-catalog fallback, exactly as before.
    const repo = new CatalogRepository(fakeDb([]));
    expect(await repo.findByArtisan(1)).toEqual([]);
    await expect(new CatalogRepository(failingDb()).findByArtisan(1)).rejects.toThrow(BOOM);
  });
});

// ---------------------------------------------------------------------------
// Admin / CMS surfaces — a 500 is strictly better than a silent lie here.
// ---------------------------------------------------------------------------
describe("Admin controllers no longer report success on a failed query", () => {
  it("CatalogApiController.getCatalogList: happy path unchanged, failure propagates", async () => {
    const ok = new CatalogApiController(fakeDb([{ id: 1n, name: "A", createdAt: 0, updatedAt: 0 }]));
    expect(await ok.getCatalogList()).toMatchObject({ success: true, message: "" });
    await expect(new CatalogApiController(failingDb()).getCatalogList()).rejects.toThrow(BOOM);
  });

  it("CatalogApiController.getCatalog: an unknown id is still data: null, a failure is not", async () => {
    expect(await new CatalogApiController(fakeDb([])).getCatalog("9")).toEqual({
      success: true,
      message: "",
      data: null,
    });
    await expect(new CatalogApiController(failingDb()).getCatalog("9")).rejects.toThrow(BOOM);
  });

  it("CustomerDomainController.get_get_customers: failure propagates, empty stays empty", async () => {
    const svc = {} as CustomerDomainService;
    expect(await new CustomerDomainController(fakeDb([]), svc).get_get_customers({})).toEqual({
      success: true,
      message: "",
      data: [],
    });
    await expect(
      new CustomerDomainController(failingDb(), svc).get_get_customers({}),
    ).rejects.toThrow(BOOM);
  });

  it("SuperUserDomainController order search: no longer hardcodes success:true on failure", async () => {
    const ok = new SuperUserDomainController(fakeDb([]));
    expect(await ok.get_get_super_user_order_list_search(undefined, "20")).toEqual({
      success: true,
      message: "",
      data: [],
      orderList: [],
    });
    await expect(
      new SuperUserDomainController(failingDb()).get_get_super_user_order_list_search(undefined, "20"),
    ).rejects.toThrow(BOOM);
  });

  it("SuperUserDomainController custom-order search: same contract", async () => {
    await expect(
      new SuperUserDomainController(failingDb()).get_get_super_user_custom_order_list_search(undefined, "20"),
    ).rejects.toThrow(BOOM);
  });
});

// ---------------------------------------------------------------------------
// Second pass: the ~135 admin/CMS-only sites the first pass deferred.
//
// These all had the same shape — `catch { return keyedResponse("data", []) }`
// (or, worse, `catch { return simpleResponse(true, "...saved!") }`, which told
// an admin a write had succeeded when the INSERT had blown up). Every route
// below was checked against apps/storefront/src for a caller before being
// changed; the ones that DO have a storefront caller are asserted separately,
// at the bottom, as deliberately-still-lenient.
// ---------------------------------------------------------------------------
describe("Table explorer / workflow / artisan / profiles / payments (admin-only)", () => {
  it("TableExplorer data dump: happy path unchanged, empty table stays empty, failure propagates", async () => {
    const rows = [{ id: 1n, name: "T" }];
    expect(await new TableExplorerDomainController(fakeDb(rows)).get_get_data_dump_tenant({}))
      .toEqual({ success: true, message: "", data: [{ id: "1", name: "T" }] });
    expect(await new TableExplorerDomainController(fakeDb([])).get_get_data_dump_tenant({}))
      .toEqual({ success: true, message: "", data: [] });
    await expect(new TableExplorerDomainController(failingDb()).get_get_data_dump_tenant({}))
      .rejects.toThrow(BOOM);
  });

  it("Workflow table-explorer read: empty stays empty, failure propagates", async () => {
    expect(await new WorkflowMigratedDomainController(fakeDb([])).get_get_table_explorer_data_workflow())
      .toEqual({ success: true, message: "", data: [] });
    await expect(new WorkflowMigratedDomainController(failingDb()).get_get_table_explorer_data_workflow())
      .rejects.toThrow(BOOM);
  });

  it("Artisan incentive config: the NO-ROWS default fallback still runs; a query failure does not", async () => {
    // This is the `catalog.repository.findByArtisan` case again: an empty
    // `artisan_incentive_config` table legitimately means "use the built-in
    // defaults", and that behaviour is preserved. What is NOT legitimate is
    // serving those defaults when the SELECT itself failed — an admin editing
    // incentive rules would have been shown, and then overwritten, defaults
    // that had nothing to do with the stored config.
    const defaults = await new ArtisanMigratedDomainController(fakeDb([])).get_get_artisan_incentive_config();
    expect(defaults.success).toBe(true);
    expect(Array.isArray(defaults.data)).toBe(true);
    expect(defaults.data.length).toBeGreaterThan(0);
    await expect(new ArtisanMigratedDomainController(failingDb()).get_get_artisan_incentive_config())
      .rejects.toThrow(BOOM);
  });

  it("Artisan step assignment no longer reports 'assigned successfully' after a failed INSERT", async () => {
    const body: any = { stepElementId: 1, artisanId: 2 };
    expect(await new ArtisanMigratedDomainController(fakeDb([])).patch_update_step_element_artisan_assignments(body))
      .toEqual({ success: true, message: "Artisan assigned to workflow step successfully." });
    await expect(new ArtisanMigratedDomainController(failingDb()).patch_update_step_element_artisan_assignments(body))
      .rejects.toThrow(BOOM);
  });

  it("Profiles finish-profile list: empty stays empty, failure propagates", async () => {
    expect(await new ProfilesDomainController(fakeDb([])).get_get_finish_profile_list())
      .toEqual({ success: true, message: "", data: [] });
    await expect(new ProfilesDomainController(failingDb()).get_get_finish_profile_list())
      .rejects.toThrow(BOOM);
  });

  it("Artisan payment ledger: failure propagates instead of an empty ledger", async () => {
    expect(await new PaymentMigratedDomainController(fakeDb([])).get_get_artisan_payment({}))
      .toEqual({ success: true, message: "", data: [] });
    await expect(new PaymentMigratedDomainController(failingDb()).get_get_artisan_payment({}))
      .rejects.toThrow(BOOM);
  });

  it("AI embedding stats no longer reports status ACTIVE when the DB is down", async () => {
    const ok = await new ContentAiMigratedDomainController(fakeDb([{ count: 1 }])).get_get_ai_embedding_stats();
    expect(ok).toMatchObject({ success: true, data: { status: "ACTIVE" } });
    await expect(new ContentAiMigratedDomainController(failingDb()).get_get_ai_embedding_stats())
      .rejects.toThrow(BOOM);
  });

  it("Forex admin read by id: failure propagates (no storefront caller for /get/forex/:forexId)", async () => {
    const ip = {} as IPLocationService;
    await expect(new CurrencyLocationDomainController(failingDb(), ip).get_get_forex_forexId("1"))
      .rejects.toThrow(BOOM);
  });
});

// ---------------------------------------------------------------------------
// Deliberately LEFT lenient — these three have a storefront caller, so the
// conservative rule applies: a 500 here would break a customer-facing page,
// and that trade-off is a product decision, not a refactor.
// ---------------------------------------------------------------------------
describe("Routes deliberately left swallowing (storefront callers)", () => {
  it("/get/discount-list still degrades to an empty list — apps/storefront/src/app/api/checkout/discount/route.ts", async () => {
    expect(await new DiscountMigratedDomainController(failingDb()).get_get_discount_list())
      .toEqual({ success: true, message: "", data: [] });
  });

  it("/get/forex-list still degrades to an empty list — apps/storefront/src/stores/currency.store.ts", async () => {
    const ip = {} as IPLocationService;
    expect(await new CurrencyLocationDomainController(failingDb(), ip).get_get_forex_list({}))
      .toEqual({ success: true, message: "", data: [], forexList: [] });
  });

  it("/get/ip-wise/currency still falls back to INR — public route, external geo-IP dependency", async () => {
    const ip = { getCurrencyCountryFromIPAddress: async () => { throw BOOM; } } as unknown as IPLocationService;
    expect(await new CurrencyLocationDomainController(fakeDb([]), ip).get_get_ip_wise_currency({ headers: {} }, {}))
      .toEqual({ success: true, message: "", currency: { country: "India", continent: "Asia", currency: "inr" } });
  });
});
