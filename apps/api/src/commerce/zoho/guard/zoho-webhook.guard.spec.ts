/**
 * ZohoWebhookGuard accept/reject — the NestJS equivalent of Loom's
 * @NVerseDomainValidated(headerKeys={"User-Agent","Zoho-Request-Ip"},
 * headerValues={"ZohoBooks-Agent","103.89.74.49"})
 * (ZohoStockSyncWebhookController.java:31-41).
 */
import { describe, expect, it } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { ZohoWebhookGuard } from "./zoho-webhook.guard.js";

const DEFAULTS = {
  ZOHO_WEBHOOK_USER_AGENT: "ZohoBooks-Agent",
  ZOHO_WEBHOOK_ALLOWED_IPS: "103.89.74.49",
  ZOHO_WEBHOOK_ENFORCE_PEER_IP: false,
};

const guardWith = (env: Record<string, unknown>) =>
  new ZohoWebhookGuard({ get: (key: string) => env[key] } as never);

const ctx = (headers: Record<string, string>, extra: Record<string, unknown> = {}) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ url: "/zoho/webhook/bill", headers, ...extra }) }),
  }) as never;

const GOOD = { "user-agent": "ZohoBooks-Agent", "zoho-request-ip": "103.89.74.49" };

describe("ZohoWebhookGuard", () => {
  it("accepts a request carrying both Loom header values", () => {
    expect(guardWith(DEFAULTS).canActivate(ctx(GOOD))).toBe(true);
  });

  it.each([
    ["no headers at all", {}],
    ["missing User-Agent", { "zoho-request-ip": "103.89.74.49" }],
    ["missing Zoho-Request-Ip", { "user-agent": "ZohoBooks-Agent" }],
    ["wrong User-Agent", { ...GOOD, "user-agent": "curl/8.4.0" }],
    ["wrong Zoho-Request-Ip", { ...GOOD, "zoho-request-ip": "1.2.3.4" }],
  ])("rejects: %s", (_label, headers) => {
    expect(() => guardWith(DEFAULTS).canActivate(ctx(headers as Record<string, string>))).toThrow(
      ForbiddenException,
    );
  });

  it("honours an env-overridden agent and a multi-entry IP allowlist", () => {
    const env = {
      ...DEFAULTS,
      ZOHO_WEBHOOK_USER_AGENT: "ZohoBooks-Agent-v2",
      ZOHO_WEBHOOK_ALLOWED_IPS: "10.0.0.1, 103.89.74.50",
    };
    const headers = { "user-agent": "ZohoBooks-Agent-v2", "zoho-request-ip": "103.89.74.50" };
    expect(guardWith(env).canActivate(ctx(headers))).toBe(true);
    // The old default must no longer work once overridden.
    expect(() => guardWith(env).canActivate(ctx(GOOD))).toThrow(ForbiddenException);
  });

  it.each([
    ["blank expected User-Agent", { ...DEFAULTS, ZOHO_WEBHOOK_USER_AGENT: "" }],
    ["empty IP allowlist", { ...DEFAULTS, ZOHO_WEBHOOK_ALLOWED_IPS: "" }],
    ["config entirely absent", {}],
  ])("FAILS CLOSED on missing config: %s", (_label, env) => {
    expect(() => guardWith(env).canActivate(ctx(GOOD))).toThrow(ForbiddenException);
  });

  describe("ZOHO_WEBHOOK_ENFORCE_PEER_IP", () => {
    const env = { ...DEFAULTS, ZOHO_WEBHOOK_ENFORCE_PEER_IP: true };

    it("accepts when X-Forwarded-For's client entry is allowlisted", () => {
      const headers = { ...GOOD, "x-forwarded-for": "103.89.74.49, 10.0.0.7" };
      expect(guardWith(env).canActivate(ctx(headers))).toBe(true);
    });

    it("rejects a spoofed header set arriving from an unlisted peer", () => {
      expect(() =>
        guardWith(env).canActivate(ctx(GOOD, { socket: { remoteAddress: "::ffff:198.51.100.9" } })),
      ).toThrow(ForbiddenException);
    });

    it("is off by default, so an App Runner proxy peer does not break delivery", () => {
      expect(
        guardWith(DEFAULTS).canActivate(ctx(GOOD, { socket: { remoteAddress: "10.0.0.7" } })),
      ).toBe(true);
    });
  });
});
