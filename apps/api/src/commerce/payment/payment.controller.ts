import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PaymentService } from "./payment.service.js";

@ApiTags("payment")
@Controller({ path: ["payment", ""] })
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Get("get/payment")
  @ApiOperation({ summary: "Get all payment records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/payment")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a payment record" })
  @ApiBody({ schema: { type: "object", additionalProperties: true } })
  async create(@Body() body: unknown) {
    return this.service.create(body);
  }
}

