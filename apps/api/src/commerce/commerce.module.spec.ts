/**
 * apps/api/src/commerce/commerce.module.spec.ts
 *
 * Eight modules existed on disk but were never listed in CommerceModule's
 * `imports`, so Nest registered none of their routes and the CMS got 404s on
 * ~69 endpoints it calls in production. This spec is the guard against that
 * regressing, in both directions:
 *
 *   1. The modules that SHOULD be wired stay wired.
 *   2. NverseModule and ZohoModule were held OUT for security (ungated
 *      dummy-token auth; unauthenticated webhooks). Those defects were fixed,
 *      so they are now imported — and the second describe block pins the
 *      conditions that made the import safe. Break any of them (reintroduce a
 *      literal token, a hardcoded OTP, a plaintext compare, a per-path error
 *      message, or an unguarded webhook) and this file fails.
 */
import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { MODULE_METADATA } from "@nestjs/common/constants.js";
import { CommerceModule } from "./commerce.module.js";
import { FaqModule } from "./faq/faq.module.js";
import { SkillModule } from "./skill/skill.module.js";
import { WorkflowModule } from "./workflow/workflow.module.js";
import { Table_explorerModule } from "./table_explorer/table_explorer.module.js";
import { ArtisanpaymentModule } from "./artisanpayment/artisanpayment.module.js";
import { NotificationModule } from "./notification/notification.module.js";
import { ImpactModule } from "./impact/impact.module.js";
import { NverseModule } from "./nverse/nverse.module.js";
import { ZohoModule } from "./zoho/zoho.module.js";
import { TagModule } from "./product/tag/tag.module.js";
import { TagController } from "./product/controller/tag.controller.js";
import { NVerseController } from "./nverse/controller/nverse.controller.js";
import { ZohoController } from "./zoho/controller/zoho.controller.js";
import { ZohoWebhookGuard } from "./zoho/guard/zoho-webhook.guard.js";
import { GUARDS_METADATA } from "@nestjs/common/constants.js";
import { readFileSync } from "node:fs";

const importsOf = (mod: unknown): unknown[] =>
  (Reflect.getMetadata(MODULE_METADATA.IMPORTS, mod as object) as unknown[]) ?? [];
const controllersOf = (mod: unknown): unknown[] =>
  (Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, mod as object) as unknown[]) ?? [];

describe("CommerceModule wiring", () => {
  const imports = importsOf(CommerceModule);

  it.each([
    ["FaqModule", FaqModule],
    ["SkillModule", SkillModule],
    ["WorkflowModule", WorkflowModule],
    ["Table_explorerModule", Table_explorerModule],
    ["ArtisanpaymentModule", ArtisanpaymentModule],
    ["NotificationModule", NotificationModule],
    ["ImpactModule", ImpactModule],
  ])("imports %s, so its routes are registered", (_name, mod) => {
    expect(imports).toContain(mod);
  });

  it("wires TagController, which serves /get/tag/list for the CMS", () => {
    expect(controllersOf(TagModule)).toContain(TagController);
  });

  it("keeps the generic table-explorer wildcard last, behind the per-entity routes", () => {
    // `get/table-explorer/data/:tableName` would shadow every specific
    // table-explorer route registered after it.
    expect(imports[imports.length - 1]).toBe(Table_explorerModule);
  });
});

/**
 * NverseModule and ZohoModule were excluded from CommerceModule for security.
 * They are now imported, and these tests are the conditions under which that
 * import is allowed to stand. Each one fails loudly if the fix is reverted.
 */
describe("CommerceModule conditional imports (NVerse / Zoho)", () => {
  const imports = importsOf(CommerceModule);

  it("imports NverseModule", () => {
    expect(imports).toContain(NverseModule);
  });

  it("imports ZohoModule", () => {
    expect(imports).toContain(ZohoModule);
  });

  /**
   * Read a source file with comments stripped — the comments legitimately name
   * the stubs that were removed ('dummy-jwt-token', "1234"), so scanning raw
   * text would flag the very documentation of the fix.
   */
  const codeOf = (relative: string): string =>
    readFileSync(new URL(relative, import.meta.url), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");

  const guardsOf = (controller: object, method: string): unknown[] =>
    (Reflect.getMetadata(
      GUARDS_METADATA,
      (controller as { prototype: Record<string, unknown> }).prototype[method] as object,
    ) as unknown[]) ?? [];

  // ---- NVerse -----------------------------------------------------------
  //
  // The NVerse auth routes are intentionally ungated (they mint the token, like
  // POST /auth/authenticate). The exclusion was never really about the missing
  // @RequireGate — it was about what sat behind it. These pin that.

  it("NVerseService issues tokens through GatekeeperService, never a literal string", () => {
    const source = codeOf("./nverse/service/nverse.service.ts");
    expect(source).not.toMatch(/dummy-jwt-token/);
    expect(source).toContain("this.gatekeeper.generateToken");
  });

  it("NVerseService has no hardcoded OTP and no plaintext password compare", () => {
    const source = codeOf("./nverse/service/nverse.service.ts");
    expect(source).not.toMatch(/["']1234["']/);
    expect(source).not.toMatch(/userPassword\s*!==/);
    expect(source).toContain("this.gatekeeper.verifyPassword");
  });

  it("the MSG91 service is gated on OUTBOUND_SMS_ENABLED and never returns an OTP value", () => {
    const source = codeOf("./nverse/service/msg91-otp.service.ts");
    expect(source).toContain("OUTBOUND_SMS_ENABLED");
    // No local OTP generation of any kind — that is FakeOTPController's bug.
    expect(source).not.toMatch(/Math\.random|randomInt/);
  });

  it("no FakeOTPController-shaped handler was ported", () => {
    const names = Object.getOwnPropertyNames(NVerseController.prototype);
    expect(names.filter((n) => /fake/i.test(n))).toHaveLength(0);
  });

  it("every anonymous NVerse failure path returns the same non-enumerable message", () => {
    const source = codeOf("./nverse/service/nverse.service.ts");
    // Every simpleResponse(false, ...) in the anonymous flows must use the
    // single shared constant — no bespoke "User not found" / "Invalid OTP".
    const falseResponses = source.match(/simpleResponse\(\s*false,\s*([^)]+)\)/g) ?? [];
    expect(falseResponses.length).toBeGreaterThan(0);
    const bespoke = falseResponses.filter((r) => !r.includes("GENERIC_FAILURE") && !r.includes("Token not found"));
    expect(bespoke).toEqual([]);
  });

  // ---- Zoho -------------------------------------------------------------

  it("every Zoho webhook handler is behind ZohoWebhookGuard", () => {
    const webhooks = Object.getOwnPropertyNames(ZohoController.prototype).filter(
      (m) => m !== "constructor" && m.toLowerCase().includes("webhook"),
    );
    expect(webhooks.length).toBeGreaterThan(0);
    for (const method of webhooks) {
      expect(guardsOf(ZohoController, method)).toContain(ZohoWebhookGuard);
    }
  });
});
