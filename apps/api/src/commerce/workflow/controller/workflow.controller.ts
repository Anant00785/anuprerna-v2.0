import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WorkflowService } from '../service/workflow.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { parseWorkflowTemplateInput, parseWorkflowInput } from '../dto/workflow.dto.js';
import { parseWorkflowInsert, parseWorkflowUpdate } from '../dto/workflow-input.js';
import { CurrentTenant } from '../../../common/auth/current-tenant.decorator.js';

@ApiBearerAuth()
@ApiTags("Workflow")
@Controller()
@UseGuards(RolesGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // --- Workflow Template ---
  @Get('get/workflow-template-list')
  @RequireGate(GateCode.CODE_SU)
  async getWorkflowTemplateList() {
    // Key is `workflowTemplateList`, matching Loom's
    // ResponseParameter.WORKFLOW_TEMPLATE_LIST (ResponseParameter.java:230) and
    // what apps/cms/src/lib/artisanflow-api.ts reads. It answered `data`, which
    // the CMS only tolerated because pickArray falls back to "any array in the
    // object" — its sibling below had no such fallback and always saw null.
    const templates = await this.workflowService.getWorkflowTemplates();
    return keyedResponse('workflowTemplateList', templates);
  }

  @Get('get/workflow-template/:templateId')
  @RequireGate(GateCode.CODE_SU)
  async getWorkflowTemplate(@Param('templateId') templateId: number) {
    // ResponseParameter.WORKFLOW_TEMPLATE (ResponseParameter.java:229). The CMS
    // reads `j.workflowTemplate` with NO fallback, so under the old `data` key
    // every single-template read resolved to null — the template editor could
    // never load a template.
    const template = await this.workflowService.getWorkflowTemplateById(templateId);
    return keyedResponse('workflowTemplate', template);
  }

  @Post('add/workflow-template')
  @RequireGate(GateCode.CODE_SU)
  async addWorkflowTemplate(@Body() body: any) {
    const input = parseWorkflowTemplateInput(body);
    const result = await this.workflowService.createWorkflowTemplate(input);
    return keyedResponse('data', result);
  }

  @Patch('update/workflow-template')
  @RequireGate(GateCode.CODE_SU)
  async updateWorkflowTemplate(@Body() body: any) {
    const input = parseWorkflowTemplateInput(body);
    const result = await this.workflowService.updateWorkflowTemplate(body.id, input);
    return keyedResponse('data', result);
  }

  @Delete('delete/workflow-template/:templateId')
  @RequireGate(GateCode.CODE_SU)
  async deleteWorkflowTemplate(@Param('templateId') templateId: number) {
    await this.workflowService.deleteWorkflowTemplate(templateId);
    return simpleResponse(true, 'Template deleted successfully');
  }

  @Get('get/table-explorer/data/workflow-template')
  @RequireGate(GateCode.CODE_SU)
  async exploreWorkflowTemplates(@Query('page') page: number, @Query('size') size: number) {
    const data = await this.workflowService.getTableExplorerWorkflowTemplates(page, size);
    return keyedResponse('data', data);
  }

  // --- Workflow ---
  @Get('get/workflow-list/:status')
  @RequireGate(GateCode.CODE_SU)
  async getWorkflowList(@Param('status') status: string) {
    const workflows = await this.workflowService.getWorkflowsByStatus(status);
    // ResponseParameter.WORKFLOW_LIST. Survived under `data` only because the
    // CMS's pickArray falls back to "any array in the object" — not a contract.
    return keyedResponse('workflowList', workflows);
  }

  @Get('get/artisan/workflow-list/:status')
  @RequireGate(GateCode.CODE_AR)
  // TODO: Replace with CODE_ARTISAN when available
  @RequireGate(GateCode.CODE_SU)
  async getArtisanWorkflowList(@Param('status') status: string, @CurrentTenant() tenant: any) {
    const artisanId = tenant?.userId; // Assuming tenant resolves userId for artisan
    const workflows = await this.workflowService.getArtisanWorkflowsByStatus(status, artisanId);
    return keyedResponse('data', workflows);
  }

  @Get('get/workflow/:workflowId')
  @RequireGate(GateCode.CODE_SU)
  async getWorkflow(@Param('workflowId') workflowId: number) {
    const workflow = await this.workflowService.getWorkflowById(workflowId);
    // ResponseParameter.WORKFLOW. The CMS reads `j.workflow` with NO fallback,
    // so under `data` every single-workflow read resolved to null.
    return keyedResponse('workflow', workflow);
  }

  @Post('add/workflow')
  @RequireGate(GateCode.CODE_SU)
  async addWorkflow(@CurrentTenant() tenant: any, @Body() body: any) {
    // tenantId comes from the TOKEN. Every production workflow row's tenant_id
    // is a ROLE_SUPER_USER — it records who started the job — and taking it
    // from the body would let a caller file a job under someone else's name.
    const input = parseWorkflowInsert(body, Number(tenant?.tenantId ?? tenant?.id));
    const [created] = await this.workflowService.createWorkflow(input);
    // `steps` is accepted by the CMS form but NOT persisted here: stages live in
    // step_element/subprocess_element and Loom builds them in a separate call.
    // Reported rather than silently dropped — see docs/KNOWN-GAPS.md.
    return keyedResponse('workflow', created ?? null);
  }

  @Patch('update/workflow')
  @RequireGate(GateCode.CODE_SU)
  async updateWorkflow(@Body() body: any) {
    // parseWorkflowInput mapped `templateId`, which is not a column, so an
    // update wrote nothing and still reported success.
    const input = parseWorkflowUpdate(body);
    const result = await this.workflowService.updateWorkflow(body.id, input);
    return keyedResponse('workflow', Array.isArray(result) ? (result[0] ?? null) : result);
  }

  @Delete('delete/workflow/:workflowId')
  @RequireGate(GateCode.CODE_SU)
  async deleteWorkflow(@Param('workflowId') workflowId: number) {
    await this.workflowService.deleteWorkflow(workflowId);
    return simpleResponse(true, 'Workflow deleted successfully');
  }
}
