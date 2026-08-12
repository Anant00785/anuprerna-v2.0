import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { ReviewService } from "./review.service.js";

@ApiTags("review")
@Controller()
export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  @Get("get/review")
  @ApiOperation({ summary: "Get all review records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/review")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a review record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

