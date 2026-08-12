import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationService } from "./notification.service.js";

@ApiTags("notification")
@Controller({ path: ["notification", ""] })
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
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

