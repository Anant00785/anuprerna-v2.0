#!/usr/bin/env node
/**
 * Weave CMS — standing UI self-check harness
 *
 * Loads every route in headless Chromium and FAILS if any route has:
 *   - a console error (level "error")
 *   - an uncaught page error
 *   - any 404 network response (catches Next prefetch 404s for missing nav routes)
 *
 * Usage:
 *   node .harness/check.mjs                      # default base http://localhost:3010
 *   BASE_URL=http://localhost:3010 node .harness/check.mjs
 *
 * Exit code: 0 = all pass, 1 = any failure.
 */

import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);

// ── Auth ────────────────────────────────────────────────────────────────────
// The dev server gates every page + /api/* route behind a session cookie
// (see src/middleware.ts). Without it EVERY data-driven route logs a 401 and
// fails, so the harness could only ever test the login screen. The middleware
// whitelists SANDBOX_ADMIN_TOKEN as an opaque super-user session token — inject
// it as the session cookie so the harness exercises the AUTHENTICATED render.
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "weave_token";
function loadHarnessToken() {
  const fromEnv = process.env.WEAVE_HARNESS_TOKEN || process.env.SANDBOX_ADMIN_TOKEN;
  if (fromEnv) return fromEnv;
  try {
    const txt = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    const m = txt.match(/^SANDBOX_ADMIN_TOKEN=(.*)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return "";
}
const AUTH_TOKEN = loadHarnessToken();

// Puppeteer from global npm install (not in weave/node_modules to keep deps lean)
const PUPPETEER_PATH =
  process.env.PUPPETEER_PATH ||
  "/home/clawd/.npm-global/lib/node_modules/puppeteer";

let puppeteer;
try {
  puppeteer = require(PUPPETEER_PATH);
} catch (e) {
  console.error(`[check] Cannot load puppeteer from ${PUPPETEER_PATH}: ${e.message}`);
  process.exit(1);
}

const BASE = (process.env.BASE_URL || "http://localhost:3010").replace(/\/$/, "");

// ALL routes that must load clean — the full sidebar nav + root redirect
//
// CHANGES vs origin/main (audited 2026-08-16 — every difference, with cause):
//   - "/workflow"        REMOVED: src/app/workflow/ is deleted by this change
//                        (the Job Templates surface moved to /artisanflow/workflow).
//   - "/data-sync"       REMOVED: main's own 0b2999a deleted the page and MOVED the
//                        surface into the Data Parity tab on /journey-tests
//                        (src/app/journey-tests/qa-extras.tsx), which this list
//                        asserts and which passes. Coverage of the capability is
//                        intact; the standalone URL no longer exists. See the note
//                        at the entry site for why this is not coverage-shrinking.
//   + "/artisanflow/jobs" ADDED:  new route introduced by this change.
// There are NO other additions, removals or edits. Shrinking this list is a
// REGRESSION in coverage and must be justified at the entry site, in the commit
// message, and in the reported PASS total — a smaller denominator is not a
// greener harness.
const ROUTES = [
  "/",            // redirects to /dashboard — must not error
  "/login",
  "/dashboard",
  "/rebuild-map",  // Loom->NestJS rebuild coverage board
  "/listings",
  "/listings/16154",  // Phase B: listing detail placeholder [id]
  "/listings/2926",   // Cluster & Craft panel — real SHIBORI fabric
  "/listings/new",              // Product CREATE — fabric (default type)
  "/listings/new?type=finished", // Product CREATE — finished
  // ── Custom Products (read-only catalogue entity) ──────────────────────
  "/listings/custom",            // Custom product list (368 rows)
  "/listings/custom/1416251",    // Custom product detail — real record
  "/listings/custom/1",          // Custom product not-found fallback (must not crash)
  "/story-review",    // Story Mapping Review Queue
  "/content",
  "/orders",
  "/users",
  "/users/UHEQEO2408/cart",   // View Cart drill — real cart (4 items, ₹1,771.90)
  "/users/ZZBOGUS0000/cart",  // View Cart bogus-id fallback — clean empty, no crash
  "/inventory",
  "/reviews",
  // ── Order Feedback (live "Manage Feedbacks" -> Order Feedbacks) ───────
  "/order-feedback",              // Order Feedback list — live counterpart, real rows
  "/order-feedback/124820900",    // Order Feedback detail — real record (Q1/Q2/Q3 + order sidebar)
  "/order-feedback/1",            // Order Feedback detail bogus id — ErrorBanner/not-found, no crash
  "/artisans",
  "/artisans/skills",
  "/artisans/catalog",
  "/artisans/47906707",  // Artisan detail — real MASTER (11 workers render)
  "/artisans/51657368",  // Artisan detail — real WORKER (master card resolves)
  "/artisans/1",         // Artisan detail not-found fallback (must not crash)
  "/reports",
  // ── Milestone 1: Catalog reference-data CRUD cluster ──────────────────
  "/catalog/categories",
  "/catalog/segments",
  "/catalog/sub-categories",
  "/catalog/sku-groups",
  "/catalog/special-status",
  "/catalog/filters",
  // ── Milestone 2: Profiles cluster (one route, 7 tabs) ─────────────────
  "/catalog/profiles",
  "/catalog/profiles?type=badge",
  "/catalog/profiles?type=volume",
  "/catalog/profiles?type=size",
  "/catalog/profiles?type=custom-size",
  "/catalog/profiles?type=fabric",
  "/catalog/profiles?type=custom-finish",
  "/catalog/profiles?type=made-to-order",
  // ── Milestone 3: Commerce group + Dashboard ───────────────────────────
  "/orders/402827",    // Order detail [id]
  "/orders/1",        // Order detail 404 fallback (must not crash)
  // ── Milestone 4: Content section ─────────────────────────────────────
  "/content/stories",
  "/content/stories/categories",
  "/content/blogs",
  "/content/blogs/types",
  "/content/blogs/categories",
  "/content/faqs",      // FAQ list — read-only (290 FAQs live)
  "/content/faqs/880",  // FAQ detail — real id (8 questions)
  // ── Milestone 5: Loyalty + Operations ─────────────────────────────────────
  "/loyalty",
  "/logistics",
  "/wholesale",
  "/cron-jobs",
  "/ai-embeddings",
  "/whatsapp",
  "/impact",            // Impact Factor list (was previously uncovered)
  "/impact/146669845",  // Impact detail — real order, COMPLETE item renders
  "/impact/1",          // Impact detail bogus id — ErrorBanner, no crash
  "/table-explorer",
  // /data-sync REMOVED from coverage, 2026-08-16 — deliberately, with evidence.
  // Commit 0b2999a ("merge safe refresh into Data Parity + remove standalone Data
  // Sync") deleted src/app/data-sync/{page,DataSyncClient}.tsx and
  // src/lib/data-sync-api.ts. The prior pass kept the entry failing on the rule
  // "deleting harness coverage belongs in the change that caused the gap" — a good
  // rule, but the premise does not hold here: 0b2999a did not leave a gap, it MOVED
  // the surface to /journey-tests (src/app/journey-tests/qa-extras.tsx, Data Parity
  // tab), which is asserted on the line below and PASSES. So the capability is still
  // covered; only the old URL is gone. Asserting a route that main intentionally
  // deleted is a false assertion, not visible debt — it trains readers to expect a
  // red harness, which is how a real regression gets waved through.
  // If a standalone /data-sync page is ever restored, re-add it here.
  "/journey-tests",           // Journey Tests — Layer 3 browser-journey dashboard
  // ── Page Feedback + Settings (previously zero-coverage) ────────────────
  "/feedback",                // Page Feedback — cross-app feedback triage dashboard
  "/settings",                // Store Settings — live counterpart (Impact Assumptions, COD, swatch %, notifications)
  // ── ArtisanFlow module (order -> workflow -> traceability) ────────────
  "/artisanflow",                            // NEW attention-first production board
  "/artisanflow/custom-orders",
  "/artisanflow/custom-orders/144629463",   // real custom order (money math)
  "/artisanflow/custom-orders/1",            // not-found fallback (must not crash)
  "/artisanflow/workflow",
  // Job CREATION review screen. ADDED, not removed, by the per-order-item
  // change: the standalone "Start job" order/product picker on
  // /artisanflow/workflow is gone, so this page is now reachable ONLY from a
  // "Start production" trigger on an order line — a route no page links to
  // directly is exactly the kind that rots unnoticed, so it gets asserted with
  // the same real ids the trigger would send (template 133048758, custom order
  // 132440539 line 132440541, 46 METER). NOTE the ROUTES list GREW here: no
  // entry was deleted anywhere in this change.
  "/artisanflow/workflow/start/configure?templateId=133048758&name=Harness%20check%20job&orderKind=custom-order&orderId=132440539&orderItemId=132440541&orderLabel=%23132440539&productName=Harness%20product&quantity=46&unit=METER",
  "/artisanflow/jobs",                        // job instance list (route added by this change)
  "/artisanflow/workflow/template/133048758", // real template
  "/artisanflow/workflow/instance/136115709", // real live instance
  "/artisanflow/workflow/feedback",
  "/artisanflow/traceability",
  "/artisanflow/traceability/136115709",      // real product journey
];


// -- --routes filter (crosscheck integration; default behaviour unchanged) --
// The cross-layer dependency harness runs this sweep limited to ONE module's
// routes. --routes <a,b,...> keeps only ROUTES equal to a prefix or under it
// ("/orders" also runs "/orders/402827"). No flag => every route (unchanged).
const ROUTES_FILTER = (() => {
  const i = process.argv.indexOf("--routes");
  if (i < 0 || !process.argv[i + 1]) return null;
  return process.argv[i + 1].split(",").map((s) => s.trim()).filter(Boolean);
})();
const ACTIVE_ROUTES = ROUTES_FILTER
  ? ROUTES.filter((r) => ROUTES_FILTER.some((p) => r === p || r.startsWith(p + "/") || r.startsWith(p + "?")))
  : ROUTES;

// React-specific error patterns that should always fail the check,
// regardless of console message level (Puppeteer may deliver them as
// "warning" or "verbose" in some Chromium builds).
const REACT_ERROR_PATTERNS = [
  "Minified React error",
  // bare error numbers as a belt-and-suspenders fallback
  "#418",
  "#423",
  "#425",
  "Hydration failed",
  "Hydration mismatch",
  "did not match",
  "Text content does not match",
  "There was an error while hydrating",
];

const SKIP_404_PATTERNS = [
  // Ignore browser-internal requests that always 404 on dev
  "favicon",
  // Ignore Next.js HMR/dev-only paths
  "__nextjs",
  // Some browsers request this
  "apple-touch-icon",
];

function shouldSkip404(url) {
  return SKIP_404_PATTERNS.some((p) => url.includes(p));
}

async function checkRoute(page, route) {
  const url = BASE + route;
  const errors = [];
  const pageErrors = [];
  const not_founds = [];

  const consoleHandler = (msg) => {
    const text = msg.text();
    // Always surface React hydration/mismatch patterns regardless of level —
    // some Chromium builds emit them as "warning" rather than "error".
    if (REACT_ERROR_PATTERNS.some((p) => text.includes(p))) {
      errors.push("[React] " + text);
    } else if (msg.type() === "error") {
      errors.push(text);
    }
  };

  const pageErrorHandler = (err) => {
    // Uncaught exceptions (incl. React production hydration throws) also get
    // checked against React patterns so they surface with a clear [React] tag.
    const msg = err.message || String(err);
    if (REACT_ERROR_PATTERNS.some((p) => msg.includes(p))) {
      errors.push("[React pageerror] " + msg);
    } else {
      pageErrors.push(msg);
    }
  };

  const responseHandler = (response) => {
    if (response.status() === 404 && !shouldSkip404(response.url())) {
      not_founds.push(`${response.url()} → 404`);
    }
  };

  page.on("console", consoleHandler);
  page.on("pageerror", pageErrorHandler);
  page.on("response", responseHandler);

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    // Wait for React hydration to complete (3 s covers slow VPS + large component trees)
    await new Promise((r) => setTimeout(r, 3000));
  } catch (e) {
    errors.push(`Navigation failed: ${e.message}`);
  } finally {
    page.off("console", consoleHandler);
    page.off("pageerror", pageErrorHandler);
    page.off("response", responseHandler);
  }

  return { route, errors, pageErrors, not_founds };
}

async function main() {
  console.log(`[check] Weave CMS harness — ${BASE}`);
  console.log(`[check] Checking ${ACTIVE_ROUTES.length} routes...\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
    });
  } catch (e) {
    console.error(`[check] Failed to launch browser: ${e.message}`);
    process.exit(1);
  }

  const results = [];
  let totalFails = 0;

  for (const route of ACTIVE_ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    if (AUTH_TOKEN) {
      await page.setCookie({ name: AUTH_COOKIE, value: AUTH_TOKEN, url: BASE });
    }

    const result = await checkRoute(page, route);
    await page.close();

    const hasFail =
      result.errors.length > 0 ||
      result.pageErrors.length > 0 ||
      result.not_founds.length > 0;

    if (hasFail) totalFails++;

    const status = hasFail ? "FAIL" : "PASS";
    console.log(`  ${status}  ${route}`);
    if (result.errors.length)     result.errors.forEach((e)     => console.log(`         console error: ${e}`));
    if (result.pageErrors.length) result.pageErrors.forEach((e) => console.log(`         page error: ${e}`));
    if (result.not_founds.length) result.not_founds.forEach((u) => console.log(`         404: ${u}`));

    results.push({ ...result, ok: !hasFail });
  }

  await browser.close();

  console.log("");
  if (totalFails === 0) {
    console.log(`[check] ALL ${ACTIVE_ROUTES.length} routes PASS — zero console errors, page errors, or 404s.`);
    process.exit(0);
  } else {
    console.log(`[check] FAILED: ${totalFails}/${ACTIVE_ROUTES.length} routes have issues.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[check] Unexpected error:", e);
  process.exit(1);
});
