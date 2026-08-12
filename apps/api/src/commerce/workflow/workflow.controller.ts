import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { WorkflowService } from "./workflow.service.js";

@ApiTags("workflow")
@Controller()
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Get("get/workflow")
  @ApiOperation({ summary: "Get all workflow records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/workflow")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a workflow record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

