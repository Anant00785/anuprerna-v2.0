/**
 * Cross-app contract test: every backend path this storefront requests WITHOUT a
 * bearer token must be ungated on the NestJS API.
 *
 * The sibling forex-route-contract.test.ts exists because an authorization sweep
 * put @RequireGate(CODE_SU) on three routes Loom deliberately serves publicly,
 * 401-ing every server-side render. This file generalises that guard to the rest
 * of the anonymous surface: SSR/SSG has no user session, so a gate on any path
 * below is an outage, not a hardening.
 *
 * Each entry cites the Java evidence that the route is public in Loom — a handler
 * that calls response.buildList/buildEntity directly, or takes only @RequestBody,
 * never getEntity/postEntity with a CODE_* argument.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const API_SRC = resolve(__dirname, "../../../../api/src");

function controllerFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...controllerFiles(p));
    else if (name.endsWith(".controller.ts")) out.push(p);
  }
  return out;
}

/** Every decorator cluster in the API, as `{ routes, hasGate }`. */
const CLUSTERS = controllerFiles(API_SRC).flatMap((file) => {
  const src = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  // A handler unit ends at its `async name(` line; its decorators are the
  // trailing decorator lines of the preceding unit.
  return src.split(/\n(?=\s*(?:public\s+)?async\s+\w+\s*\()/).slice(0, -1).map((unit) => {
    const cluster = unit.slice(unit.lastIndexOf("\n\n") + 1);
    // `@Get("/a")` and the array form `@Get(["/a", "/b"])` both occur.
    const routes = [...cluster.matchAll(/@(?:Get|Post|Put|Patch|Delete)\(([^)]*)\)/g)].flatMap((m) =>
      [...m[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((s) => "/" + s[1].replace(/^\/+/, "")),
    );
    return { file, routes, hasGate: /@RequireGate/.test(cluster) };
  });
});

/** path -> why Loom serves it publicly */
const ANONYMOUS_CALLS: ReadonlyArray<readonly [string, string]> = [
  // --- un-gated by this pass -----------------------------------------------
  // SettingsController.getSettingsList() -> response.buildList() directly.
  // Called by components/catalogue/loom.ts during SSR.
  ["/get/settings-list", "buildList, no getEntity"],
  // MiscController.sendContactUsEmail() -> returns RainTreeResponse directly.
  // Called by components/misc-pages/loom.ts from the public /contact form.
  ["/send/contact-us", "no getEntity/postEntity"],
  // NverseAuthenticationController.validateProvider() -> @RequestBody only.
  // Called pre-login by lib/api/repositories/auth.repository.ts.
  ["/validate/provider", "@RequestBody only, pre-session"],
  // NVerseEmailVerificationController.confirmEmailVerification() -> @RequestBody only.
  // Called by app/api/auth/reset-password/route.ts with no session.
  ["/confirm/verification/email", "@RequestBody only, pre-session"],
  // OTPController.verifyOTP() -> @RequestBody only, and MINTS the JWT.
  ["/otp/verify", "@RequestBody only, mints the JWT"],

  // --- already public; pinned so a future sweep cannot re-gate them ---------
  ["/get/navigation", "buildList"],
  ["/get/navigation/fabric/craft", "buildList"],
  ["/get/navigation/finished/:category", "buildList"],
  ["/get/navigation/story/:category", "buildList"],
  ["/get/color-list", "buildList"],
  ["/get/material-list", "buildList"],
  ["/get/pattern-list", "buildList"],
  ["/get/fabric-preview-list", "buildList"],
  ["/get/fabric-product/slug/:productSlug", "buildEntity"],
  ["/get/finished-product/slug/:productSlug", "buildEntity"],
  ["/get/product-preview-list/csv/:commaSeparatedCSVList", "buildList"],
  ["/get/blog-content-list/customer", "buildList"],
  ["/get/blog-content/slug/:slug", "buildEntity"],
  ["/get/story-content-list", "buildList"],
  ["/get/story-content/slug/:slug", "buildEntity"],
  ["/get/story/related/product/:productId", "buildList"],
  ["/get/review/stats", "buildEntity"],
  ["/get/product/review/:productId", "buildList"],
  ["/search/ai/:keyword", "buildList"],
  ["/authenticate/email", "NON_AUTHENTICATED_URLS"],
  ["/check-email/tenant", "no getEntity"],
  ["/customer/registration/email", "registration, pre-session"],
  ["/send/verification/email", "pre-session"],
  ["/get/forex-list", "buildList"],
  ["/get/forex-exchange-rate/latest", "buildEntity"],
];

/**
 * The mirror image of ANONYMOUS_CALLS: paths that MUST keep their gate.
 *
 * These three were flagged as suspected 401 outages by analogy with the forex
 * routes (a gate sweep put CODE_SU on three routes Loom serves publicly and every
 * SSR render 401'd). The analogy does not hold, and the evidence is recorded here
 * so the next sweep does not "fix" them by opening an admin list to the internet:
 *
 *   - grep of the WHOLE storefront app (src, .next output and .harness reports
 *     included) finds ZERO references to any of the three paths.
 *   - Their only callers are the CMS, in apps/cms/src/lib/content-api.ts:43,49,52,
 *     each via fetchContentList(path, token) -> loomGetJson("content-api", path,
 *     token) — token-bearing admin reads, not anonymous ones.
 *   - The storefront's anonymous blog/story surface uses different, already-public
 *     endpoints: /get/blog-content-list/customer, /get/story-content-list,
 *     /get/blog-content/slug/:slug, /get/story-content/slug/:slug — all pinned in
 *     ANONYMOUS_CALLS above. No storefront blog or story page renders a category
 *     or type filter, so nothing anonymous needs these lists.
 *
 * So Loom's gate does reflect how the pages actually render, and it stays.
 */
const GATED_CALLS: ReadonlyArray<readonly [string, string]> = [
  // BlogContentCategoryController.getBlogContentCategoryList -> getEntity(..., CODE_SU,
  // UNAUTH_BLOG_CONTENT_CATEGORY_LIST_REQUEST). CMS-only (content-api.ts:52).
  ["/get/blog-content-category-list", "getEntity CODE_SU; CMS-only, sends a token"],
  // StoryContentCategoryController.getStoryContentCategories -> getEntity(..., CODE_SU).
  // CMS-only (content-api.ts:43).
  ["/get/story-content-category-list", "getEntity CODE_SU; CMS-only, sends a token"],
  // BlogContentTypeController.getBlogContentTypeList -> getEntity(..., CODE_SUCU).
  // CMS-only (content-api.ts:49).
  ["/get/blog-content-types", "getEntity CODE_SUCU; CMS-only, sends a token"],
];

describe("gated admin route contract", () => {
  for (const [path, evidence] of GATED_CALLS) {
    describe(path, () => {
      const serving = CLUSTERS.filter((c) => c.routes.includes(path));

      it("is declared on the API", () => {
        expect(serving.length).toBeGreaterThan(0);
      });

      it(`stays role-gated — no anonymous storefront caller (Loom: ${evidence})`, () => {
        expect(serving.filter((c) => !c.hasGate).map((c) => c.file)).toEqual([]);
      });
    });
  }
});

describe("public (anonymous) API route contract", () => {
  it("the API controller sources are reachable from the storefront", () => {
    expect(CLUSTERS.length).toBeGreaterThan(100);
  });

  for (const [path, evidence] of ANONYMOUS_CALLS) {
    describe(path, () => {
      const serving = CLUSTERS.filter((c) => c.routes.includes(path));

      it("is declared on the API", () => {
        expect(serving.length).toBeGreaterThan(0);
      });

      it(`is NOT role-gated — the storefront calls it with no token (Loom: ${evidence})`, () => {
        expect(serving.filter((c) => c.hasGate).map((c) => c.file)).toEqual([]);
      });
    });
  }
});
