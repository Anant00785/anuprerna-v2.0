import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateCommerceRecordDto } from "../shared/commerce-record.dto.js";
import { NotificationService } from "./notification.service.js";

@ApiTags("Notifications")
@Controller()
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get("get/notification")
  @ApiOperation({ summary: "Get all notification records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/notification")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a notification record" })
  @ApiBody({ type: CreateCommerceRecordDto })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

