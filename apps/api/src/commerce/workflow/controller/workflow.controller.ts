// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WorkflowService } from '../service/workflow.service.js';
import { RolesGuard, RequireGate } from '../../common/auth/roles.guard.js';
import { GateCode } from '../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../common/response/rain-response.js';
import { parseWorkflowTemplateInput, parseWorkflowInput } from '../dto/workflow.dto.js';
import { CurrentTenant } from '../../common/auth/current-tenant.decorator.js';

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // --- Workflow Template ---
  @Get('get/workflow-template-list')
  @RequireGate(GateCode.CODE_SU)
  async getWorkflowTemplateList() {
    const templates = await this.workflowService.getWorkflowTemplates();
    return keyedResponse('data', templates);
  }

  @Get('get/workflow-template/:templateId')
  @RequireGate(GateCode.CODE_SU)
  async getWorkflowTemplate(@Param('templateId') templateId: number) {
    const template = await this.workflowService.getWorkflowTemplateById(templateId);
    return keyedResponse('data', template);
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
    return keyedResponse('data', workflows);
  }

  @Get('get/artisan/workflow-list/:status')
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
    return keyedResponse('data', workflow);
  }

  @Post('add/workflow')
  @RequireGate(GateCode.CODE_SU)
  async addWorkflow(@Body() body: any) {
    const input = parseWorkflowInput(body);
    const result = await this.workflowService.createWorkflow(input);
    return keyedResponse('data', result);
  }

  @Patch('update/workflow')
  @RequireGate(GateCode.CODE_SU)
  async updateWorkflow(@Body() body: any) {
    const input = parseWorkflowInput(body);
    const result = await this.workflowService.updateWorkflow(body.id, input);
    return keyedResponse('data', result);
  }

  @Delete('delete/workflow/:workflowId')
  @RequireGate(GateCode.CODE_SU)
  async deleteWorkflow(@Param('workflowId') workflowId: number) {
    await this.workflowService.deleteWorkflow(workflowId);
    return simpleResponse(true, 'Workflow deleted successfully');
  }
}
