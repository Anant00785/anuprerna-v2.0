import { describe, it, expect } from "vitest";
import { toEmailHistoryDto } from "./notification.mapper.js";

describe("toEmailHistoryDto", () => {
  it("picks only id/tenantId/entityId/entityType/triggerType/status, dropping every other row field", () => {
    const row = {
      id: 1n,
      version: 2n,
      triggerType: "ORDER_PLACED",
      entityType: "ORDER",
      entityId: 99,
      tenantId: 42,
      tenantName: "Acme",
      toEmails: ["a@b.com"],
      ccEmails: [],
      bccEmails: [],
      templateId: "tmpl-1",
      status: "SENT",
      httpStatus: 200,
    } as any;

    const out = toEmailHistoryDto(row);
    expect(out).toEqual({
      id: 1n,
      tenantId: 42,
      entityId: 99,
      entityType: "ORDER",
      triggerType: "ORDER_PLACED",
      status: "SENT",
    });
    expect(out).not.toHaveProperty("templateId");
    expect(out).not.toHaveProperty("toEmails");
  });

  it("passes a null tenantId/entityId through unchanged", () => {
    const out = toEmailHistoryDto({
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
