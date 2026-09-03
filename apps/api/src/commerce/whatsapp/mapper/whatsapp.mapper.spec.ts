import { describe, it, expect } from "vitest";
import { toWhatsappHistoryDto } from "./whatsapp.mapper.js";

describe("toWhatsappHistoryDto", () => {
  it("picks only id/tenantId/entityId/entityType/triggerType/status, dropping every other row field", () => {
    const row = {
      id: 1n,
      version: 2n,
      tenantType: "TENANT",
      tenantId: 42,
      tenantName: "Acme",
      recipientMobile: "9999999999",
      fromMobile: "8888888888",
      triggerType: "ORDER_PLACED",
      entityType: "ORDER",
      entityId: 99,
      templateName: "tmpl",
      status: "SENT",
    } as any;

    const out = toWhatsappHistoryDto(row);
    expect(out).toEqual({
      id: 1n,
      tenantId: 42,
      entityId: 99,
      entityType: "ORDER",
      triggerType: "ORDER_PLACED",
      status: "SENT",
    });
    expect(out).not.toHaveProperty("recipientMobile");
    expect(out).not.toHaveProperty("templateName");
  });

  it("passes a null tenantId/entityId/entityType through unchanged", () => {
    const out = toWhatsappHistoryDto({
      id: 1n,
      tenantId: null,
      entityId: null,
      entityType: null,
      triggerType: "ORDER_PLACED",
      status: "FAILED",
    } as any);
    expect(out.tenantId).toBeNull();
    expect(out.entityId).toBeNull();
    expect(out.entityType).toBeNull();
  });
});
