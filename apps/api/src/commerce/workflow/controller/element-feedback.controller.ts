// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WorkflowService } from '../service/workflow.service.js';
import { RolesGuard, RequireGate } from '../../common/auth/roles.guard.js';
import { GateCode } from '../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../common/response/rain-response.js';
import { parseElementFeedbackInput } from '../dto/workflow.dto.js';
import { CurrentTenant } from '../../common/auth/current-tenant.decorator.js';

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ElementFeedbackController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('get/element/feedback/:feedbackId')
  @RequireGate(GateCode.CODE_SU)
  async getElementFeedback(@Param('feedbackId') feedbackId: number) {
    const feedback = await this.workflowService.getElementFeedbackById(feedbackId);
    return keyedResponse('data', feedback);
  }

  @Post('add/element/feedback')
  @RequireGate(GateCode.CODE_SU)
  async addElementFeedback(@Body() body: any) {
    const input = parseElementFeedbackInput(body);
    const result = await this.workflowService.createElementFeedback(input);
    return keyedResponse('data', result);
  }

  @Patch('update/element/feedback')
  @RequireGate(GateCode.CODE_SU)
  async updateElementFeedback(@Body() body: any) {
    const input = parseElementFeedbackInput(body);
    const result = await this.workflowService.updateElementFeedback(body.id, input);
    return keyedResponse('data', result);
  }

  @Post('add/artisan/element/feedback')
  // TODO: Replace with CODE_ARTISAN when available
  @RequireGate(GateCode.CODE_SU)
  async addArtisanElementFeedback(@Body() body: any, @CurrentTenant() tenant: any) {
    const input = parseElementFeedbackInput(body);
    input.artisanId = tenant?.userId;
    const result = await this.workflowService.createElementFeedback(input);
    return keyedResponse('data', result);
  }

  @Patch('update/artisan/element/feedback')
  // TODO: Replace with CODE_ARTISAN when available
  @RequireGate(GateCode.CODE_SU)
  async updateArtisanElementFeedback(@Body() body: any, @CurrentTenant() tenant: any) {
    const input = parseElementFeedbackInput(body);
    input.artisanId = tenant?.userId;
    const result = await this.workflowService.updateElementFeedback(body.id, input);
    return keyedResponse('data', result);
  }
}
