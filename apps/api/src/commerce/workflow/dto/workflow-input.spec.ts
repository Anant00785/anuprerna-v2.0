import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { parseWorkflowInsert, parseWorkflowUpdate } from "./workflow-input.js";

/**
 * The reported failure: CMS "Create job" -> POST /add/workflow -> 500.
 *
 *   insert into "workflow" (...19 columns...)
 *   values (default, default, ..., $1, default, ...)
 *
 * ONE bound parameter. parseWorkflowInput returned {templateId, orderId, status};
 * the column is workflowTemplateId, so Drizzle dropped it along with everything
 * else, and Postgres rejected the first NOT NULL column with no default.
 */

/** Exactly what apps/cms TemplateBuilder posts for an ORDER job. */
const cmsBody = (over: Record<string, unknown> = {}) => ({
  name: "Yarn -> Fabric (Test) — #162971907",
  description: "",
  workflowTemplateId: 136175091,
  workflowTemplateName: "Ready Product",
  type: "ORDER",
  custom: false,
  steps: [{ name: "stage" }],
  estimatedStartDate: "2026-09-04",
  orderId: 162971907,
  orderItemId: 162971921,
  ...over,
});

const ACTING = 102088400; // a real ROLE_SUPER_USER id

describe("parseWorkflowInsert", () => {
  it("maps every NOT NULL column that has no default", () => {
    const v = parseWorkflowInsert(cmsBody(), ACTING);
    for (const k of [
      "workflowTemplateId",
      "name",
      "tenantId",
      "estimatedStartDate",
      "estimatedEndDate",
      "createdAt",
      "updatedAt",
    ] as const) {
      expect(v[k], `${k} must be supplied`).toBeDefined();
      expect(v[k]).not.toBeNull();
    }
  });

  it("uses workflowTemplateId — the real column — not templateId", () => {
    expect(parseWorkflowInsert(cmsBody(), ACTING).workflowTemplateId).toBe(136175091);
    // legacy spelling still accepted
    expect(
      parseWorkflowInsert({ ...cmsBody(), workflowTemplateId: undefined, templateId: 490267 }, ACTING)
        .workflowTemplateId,
    ).toBe(490267);
  });

  it("takes tenantId from the TOKEN and ignores any in the body", () => {
    const v = parseWorkflowInsert(cmsBody({ tenantId: 999999 }), ACTING);
    expect(v.tenantId).toBe(ACTING);
  });

  it("converts a 'YYYY-MM-DD' start date to epoch millis", () => {
    const v = parseWorkflowInsert(cmsBody(), ACTING);
    expect(v.estimatedStartDate).toBe(Date.parse("2026-09-04"));
    // No end supplied: falls back to the start rather than inventing a duration.
    expect(v.estimatedEndDate).toBe(v.estimatedStartDate);
  });

  it("accepts epoch millis and epoch seconds", () => {
    const ms = 1788461123232;
    expect(parseWorkflowInsert(cmsBody({ estimatedStartDate: ms }), ACTING).estimatedStartDate).toBe(ms);
    expect(
      parseWorkflowInsert(cmsBody({ estimatedStartDate: 1788461123 }), ACTING).estimatedStartDate,
    ).toBe(1788461123000);
  });

  it("defaults status to CREATED and type to ORDER, and rejects nothing valid", () => {
    const v = parseWorkflowInsert(cmsBody({ status: undefined, type: undefined }), ACTING);
    expect(v.status).toBe("CREATED");
    expect(v.type).toBe("ORDER");
    expect(parseWorkflowInsert(cmsBody({ type: "CUSTOM_ORDER" }), ACTING).type).toBe("CUSTOM_ORDER");
  });

  it("ignores an unknown status/type rather than writing an invalid enum", () => {
    const v = parseWorkflowInsert(cmsBody({ status: "NOPE", type: "NOPE" }), ACTING);
    expect(v.status).toBe("CREATED");
    expect(v.type).toBe("ORDER");
  });

  it("carries the optional order/product references through", () => {
    const v = parseWorkflowInsert(cmsBody(), ACTING);
    expect(v.orderId).toBe(162971907);
    expect(v.orderItemId).toBe(162971921);
    expect(v.productId).toBeNull();
  });

  it("accepts the CUSTOM_ORDER reference* spellings", () => {
    const v = parseWorkflowInsert(
      cmsBody({ orderId: undefined, referenceOrderId: 5, referenceProductId: 9 }),
      ACTING,
    );
    expect(v.orderId).toBe(5);
    expect(v.productId).toBe(9);
  });

  it("rejects a missing template, a missing name, and an unknown caller", () => {
    expect(() => parseWorkflowInsert(cmsBody({ workflowTemplateId: undefined }), ACTING)).toThrow(BadRequestException);
    expect(() => parseWorkflowInsert(cmsBody({ name: "   " }), ACTING)).toThrow(BadRequestException);
    expect(() => parseWorkflowInsert(cmsBody(), 0)).toThrow(BadRequestException);
    expect(() => parseWorkflowInsert(null, ACTING)).toThrow(BadRequestException);
  });

  it("emits no key the workflow table does not have", () => {
    const columns = new Set([
      "workflowTemplateId", "name", "description", "tenantId", "productId", "status",
      "estimatedStartDate", "estimatedEndDate", "createdAt", "updatedAt",
      "orderId", "orderItemId", "type", "note",
    ]);
    for (const k of Object.keys(parseWorkflowInsert(cmsBody(), ACTING))) {
      expect(columns.has(k), `${k} is not a workflow column`).toBe(true);
    }
  });
});

describe("parseWorkflowUpdate", () => {
  it("returns only supplied fields, plus updatedAt", () => {
    const v = parseWorkflowUpdate({ name: "Renamed" });
    expect(v.name).toBe("Renamed");
    expect(v.updatedAt).toBeTypeOf("number");
    expect(v).not.toHaveProperty("tenantId");
    expect(v).not.toHaveProperty("createdAt");
  });

  it("rejects an empty update instead of silently doing nothing", () => {
    expect(() => parseWorkflowUpdate({})).toThrow(BadRequestException);
  });

  it("rejects an invalid status or type", () => {
    expect(() => parseWorkflowUpdate({ status: "NOPE" })).toThrow(BadRequestException);
    expect(() => parseWorkflowUpdate({ type: "NOPE" })).toThrow(BadRequestException);
  });

  it("maps templateId to the real column", () => {
    expect(parseWorkflowUpdate({ templateId: 490267 }).workflowTemplateId).toBe(490267);
  });
});
