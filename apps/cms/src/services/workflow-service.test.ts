import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { useHandlers, envelope, errorEnvelope } from "@/test/msw";
import { WorkflowService } from "./workflow-service";

// WorkflowService is GET-only -- no POST/PUT/PATCH method exists anywhere in
// this file. Any CMS page that needs to create or edit a workflow has no
// service method to call; that is a real gap, not something this suite can
// close (see docs/DATA-FLOW.md / CLAUDE.md: services are the only place
// backend calls may be made, and none exist here for a mutation).
describe("WorkflowService", () => {
  it("getWorkflows defaults status to 'active' in the URL path", async () => {
    let seenUrl = "";
    useHandlers(
      http.get("*/get/workflow-list/:status", ({ request, params }) => {
        seenUrl = request.url;
        expect(params.status).toBe("active");
        return HttpResponse.json(envelope("workflowList", [{ id: 1 }]));
      })
    );
    const result = await WorkflowService.getWorkflows();
    expect(seenUrl).toContain("/get/workflow-list/active");
    expect(result).toEqual([{ id: 1 }]);
  });

  it("getCustomWorkflows passes a caller-supplied status through to the URL", async () => {
    useHandlers(
      http.get("*/get/custom-workflow-list/:status", ({ params }) => {
        expect(params.status).toBe("archived");
        return HttpResponse.json(envelope("customWorkflowList", []));
      })
    );
    await WorkflowService.getCustomWorkflows("archived");
  });

  it("getArtisanPayments unwraps 'artisanPaymentRecordList'", async () => {
    useHandlers(
      http.get("*/get/artisan-payments", () => HttpResponse.json(envelope("artisanPaymentRecordList", [{ id: 1, amount: 500 }])))
    );
    const result = await WorkflowService.getArtisanPayments();
    expect(result).toEqual([{ id: 1, amount: 500 }]);
  });

  it("propagates a rejected response from getWorkflowFeedback", async () => {
    useHandlers(
      http.get("*/get/element/feedback", () => HttpResponse.json(errorEnvelope("feedback unavailable")))
    );
    await expect(WorkflowService.getWorkflowFeedback()).rejects.toThrow("feedback unavailable");
  });
});
