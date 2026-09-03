import { describe, it, expect } from "vitest";
import {
  mapWorkflowRowToDto,
  mapWorkflowTemplateRowToDto,
  mapElementFeedbackRowToDto,
} from "./workflow.mapper.js";

describe("mapWorkflowRowToDto", () => {
  it("maps id/templateId/orderId/status, dropping other row fields", () => {
    const out = mapWorkflowRowToDto({ id: 1, templateId: 2, orderId: 3, status: "IN_PROGRESS", extra: "x" });
    expect(out).toEqual({ id: 1, templateId: 2, orderId: 3, status: "IN_PROGRESS" });
  });
});

describe("mapWorkflowTemplateRowToDto", () => {
  it("maps id/name/description/isActive", () => {
    const out = mapWorkflowTemplateRowToDto({ id: 1, name: "T1", description: "desc", isActive: true });
    expect(out).toEqual({ id: 1, name: "T1", description: "desc", isActive: true });
  });

  it("preserves a false isActive rather than defaulting it", () => {
    const out = mapWorkflowTemplateRowToDto({ id: 1, name: "T1", description: "desc", isActive: false });
    expect(out.isActive).toBe(false);
  });
});

describe("mapElementFeedbackRowToDto", () => {
  it("maps id/elementId/feedbackText/artisanId", () => {
    const out = mapElementFeedbackRowToDto({ id: 1, elementId: 2, feedbackText: "Good", artisanId: 3 });
    expect(out).toEqual({ id: 1, elementId: 2, feedbackText: "Good", artisanId: 3 });
  });
});
