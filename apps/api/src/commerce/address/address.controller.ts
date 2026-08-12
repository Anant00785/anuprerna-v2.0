import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AddressService, type CreateAddressInput } from "./address.service.js";

@ApiTags("address")
@Controller({ path: ["address", ""] })
export class AddressController {
  constructor(private readonly service: AddressService) {}

  @Get("get/address")
  @ApiOperation({ summary: "Get all address records" })
  async getAll() {
    return this.service.getAll();
  }

  @Post("create/address")
  @HttpCode(200)
  @ApiOperation({ summary: "Create a address record" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["tenantId", "name", "addressLine1", "postalCode", "city", "state", "country", "primaryPhone", "contactEmail", "addressType"],
      properties: {
        tenantId: { type: "integer", example: 1 },
        name: { type: "string", example: "Anant Kumar" },
        addressLine1: { type: "string", example: "123 Main Street" },
        postalCode: { type: "string", example: "110001" },
        city: { type: "string", example: "New Delhi" },
        state: { type: "string", example: "Delhi" },
        country: { type: "string", example: "India" },
        primaryPhone: { type: "string", example: "+919999999999" },
        contactEmail: { type: "string", format: "email", example: "anant@example.com" },
        addressType: { type: "string", enum: ["BILLING", "SHIPPING"] },
      },
    },
  })
  async create(@Body() body: CreateAddressInput) {
    return this.service.create(body);
  }
}
