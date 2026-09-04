/**
 * Loom: workflow/controller/CustomWorkflowController.java
 *
 *   GET   /get/custom-workflow/{workflowId}                CODE_SU  key `workflow`
 *   GET   /get/custom-workflow-list/{status}              CODE_SU  key `workflowList`
 *   GET   /get/artisan/custom-workflow-list/{status}      CODE_AR  key `workflowList`
 *   GET   /get/custom-order/{orderId}/workflow-list       CODE_SU  key `workflowList`
 *   GET   /get/custom-order/{orderId}/workflow/{itemId}   CODE_CU  key `workflow`
 *   POST  /add/custom-workflow                            CODE_SU  simple envelope
 *   PATCH /update/custom-workflow                         CODE_SU  simple envelope
 *
 * Custom-ORDER workflows only — the standard-order list is
 * /get/workflow-list/{status} on WorkflowController. The CMS fetches BOTH and
 * merges them (apps/cms/src/lib/artisanflow-api.ts getWorkflowList), so the two
 * must stay distinct.
 *
 * GET /get/custom-workflow/{workflowId} was previously absent because
 * ArtisanAssignmentService.populateWorkflowArtisanAssignments was not ported —
 * a workflow without its assignments reads to the CMS as "nobody is assigned".
 * That enrichment IS now part of the query (the `artisanAssignments` block in
 * CustomWorkflowRepository.findCustomWorkflowDetail is exactly Loom's
 * projection of workflow_artisan_mapping, base_pay included), so the route is
 * ported. `populateArtisanPaymentStatus` has no counterpart in Loom's
 * CustomWorkflowDAOController.retrieveWorkflow and is not part of this route;
 * `basePayStatus` is therefore absent from each assignment rather than guessed,
 * which the CMS types as optional.
 */
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CurrentTenant } from "../../../common/auth/current-tenant.decorator.js";
import type { AuthenticatedTenant } from "../../../auth/types/auth.types.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import { CustomWorkflowService } from "../service/custom-workflow.service.js";
import { parseAddCustomWorkflow, parseUpdateCustomWorkflow } from "../dto/custom-workflow.dto.js";

/** Loom resolves the tenant off the token; a route that needs one cannot proceed without it. */
function tenantIdOf(tenant: AuthenticatedTenant | undefined): number {
  const id = Number(tenant?.tenantId ?? tenant?.id ?? 0);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException("The authenticated tenant could not be resolved.");
  }
  return id;
}

function positiveIdParam(raw: string, name: string): number {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new BadRequestException(`${name} must be a positive integer.`);
  }
  return value;
}

@ApiBearerAuth()
@ApiTags("ArtisanFlow")
@Controller()
@UseGuards(RolesGuard)
export class CustomWorkflowController {
  constructor(private readonly service: CustomWorkflowService) {}

  /**
   * Loom: retrieveWorkflow — CODE_SU, WorkflowResponse.buildEntity ->
   * ResponseParameter.WORKFLOW = "workflow". Read by the CMS as
   * `j.workflow` (artisanflow-api.ts getCustomWorkflowDetail).
   *
   * A standard-order workflow id, or one that does not exist, is a null payload
   * under the key — Loom's own behaviour, and not a 404 existence oracle.
   */
  @Get("/get/custom-workflow/:workflowId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "One custom-order workflow with its step tree and artisan assignments." })
  @ApiParam({ name: "workflowId", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "The custom-order workflow, or null under `workflow`." })
  async getCustomWorkflow(@Param("workflowId") workflowId: string) {
    return keyedResponse(
      "workflow",
      await this.service.getCustomWorkflowDetail(positiveIdParam(workflowId, "workflowId")),
    );
  }

  @Get("/get/custom-workflow-list/:status")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Custom-order workflow previews by status ('ALL' for every status)." })
  @ApiParam({ name: "status", example: "ALL", description: "Workflow status, or ALL" })
  @ApiResponse({ status: 200, description: "Custom-order workflow previews." })
  async getCustomWorkflowList(@Param("status") status: string) {
    return keyedResponse("workflowList", await this.service.getCustomWorkflowList(status));
  }

  /**
   * Loom: retrieveWorkflowListForArtisan — CODE_AR. The artisan is resolved from
   * the token's tenant; there is no artisan id in the path, and adding one would
   * let any artisan read another's queue.
   */
  @Get("/get/artisan/custom-workflow-list/:status")
  @RequireGate(GateCode.CODE_AR)
  @ApiOperation({ summary: "The calling artisan's custom-order workflow previews." })
  @ApiParam({ name: "status", example: "ALL", description: "Workflow status, or ALL" })
  @ApiResponse({ status: 200, description: "Custom-order workflow previews for this artisan." })
  async getArtisanCustomWorkflowList(@Param("status") status: string, @CurrentTenant() tenant: AuthenticatedTenant) {
    return keyedResponse("workflowList", await this.service.getArtisanCustomWorkflowList(tenantIdOf(tenant), status));
  }

  /** Loom: retrieveOrderWiseWorkflowList — CODE_SU, key `workflowList`. */
  @Get("/get/custom-order/:orderId/workflow-list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Workflow summaries for every item on one custom order." })
  @ApiParam({ name: "orderId", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Custom-order workflow summaries." })
  async getCustomOrderWorkflowList(@Param("orderId") orderId: string) {
    return keyedResponse(
      "workflowList",
      await this.service.getCustomOrderWorkflowList(positiveIdParam(orderId, "orderId")),
    );
  }

  /**
   * Loom: retrieveOrderwiseWorkflow — CODE_CU, key `workflow`. Scoped to the
   * caller's own tenant through `findByIdAndTenantAndDeletedFalse`; the order id
   * in the path is checked against that scope, never trusted on its own.
   */
  @Get("/get/custom-order/:orderId/workflow/:orderItemId")
  @RequireGate(GateCode.CODE_CU)
  @ApiOperation({ summary: "The step/sub-process tree for one custom order item." })
  @ApiParam({ name: "orderId", type: Number, example: 1 })
  @ApiParam({ name: "orderItemId", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Order-wise custom workflow." })
  async getOrderwiseCustomWorkflow(
    @Param("orderId") orderId: string,
    @Param("orderItemId") orderItemId: string,
    @CurrentTenant() tenant: AuthenticatedTenant,
  ) {
    const workflow = await this.service.getOrderwiseWorkflow(
      tenantIdOf(tenant),
      positiveIdParam(orderId, "orderId"),
      positiveIdParam(orderItemId, "orderItemId"),
    );
    // Loom's RainResponse renders a null entity as a null payload under the key.
    return keyedResponse("workflow", workflow);
  }

  /** Loom: addWorkflow — CODE_SU, message NEW_WORKFLOW_CREATED. */
  @Post("/add/custom-workflow")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a custom-order workflow with its full step/sub-process tree." })
  @ApiBody({ description: "Loom Workflow payload: name, workflowTemplateId, estimatedStartDate, reference ids, steps[]." })
  @ApiResponse({ status: 201, description: "New workflow created." })
  async addCustomWorkflow(@Body() body: unknown, @CurrentTenant() tenant: AuthenticatedTenant) {
    const input = parseAddCustomWorkflow(body);
    await this.service.addCustomWorkflow(input, tenantIdOf(tenant));
    return simpleResponse(true, "New workflow created");
  }

  /** Loom: updateWorkflow — CODE_SU, message WORKFLOW_UPDATED. */
  @Patch("/update/custom-workflow")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update a custom-order workflow's fields, status and artisan assignments." })
  @ApiBody({ description: "Loom Workflow payload: id, name, status, metrics, artisanAssignments[]." })
  @ApiResponse({ status: 200, description: "Workflow updated." })
  async updateCustomWorkflow(@Body() body: unknown) {
    const input = parseUpdateCustomWorkflow(body);
    const outcome = await this.service.updateCustomWorkflow(input);

    if (outcome === "NOT_FOUND") {
      // Loom: ActionCode.NO_ACTION -> the RainTree failure envelope, not a 404.
      return simpleResponse(false, "No custom workflow found for the given id");
    }
    if (outcome === "BASE_PAY_CONFLICT") {
      // Loom: ActionCode.INCORRECT_INFORMATION.
      return simpleResponse(false, "An artisan already holds a different base pay on this workflow");
    }
    return simpleResponse(true, "Workflow updated");
  }
}
