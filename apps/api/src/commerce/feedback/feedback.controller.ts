import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FeedbackService } from "./feedback.service.js";

@ApiTags("feedback")
@Controller({ path: ["feedback", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

