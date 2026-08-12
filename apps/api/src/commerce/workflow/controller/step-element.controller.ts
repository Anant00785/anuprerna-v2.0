// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { WorkflowService } from '../service/workflow.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class StepElementController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('get/artisan/step-element-list/:status')
  // TODO: Replace with CODE_ARTISAN when available
  @RequireGate(GateCode.CODE_SU)
  async getArtisanStepElementList(@Param('status') status: string) {
    // Stub implementation
    return keyedResponse('data', []);
  }

  @Patch('update/step-element')
  @RequireGate(GateCode.CODE_SU)
  async updateStepElement(@Body() body: any) {
    const result = await this.workflowService.updateStepElement(body.id, body);
    return keyedResponse('data', result);
  }
}
