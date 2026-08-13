import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { FeedbackService } from "./feedback.service.js";

@ApiTags("Feedback")
@Controller()
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Get("get/feedback")
  @ApiOperation({ summary: "Get all feedback records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/feedback")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a feedback record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

