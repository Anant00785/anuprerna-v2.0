import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AddressService, type CreateAddressInput } from "./address.service.js";

@ApiTags("Address")
@Controller()
export class AddressController {
  constructor(private readonly service: AddressService) {}

  @Get("get/address")
  @ApiOperation({ summary: "Get all address records" })
  async getAll() {
    return this.service.getAll();
  }

  @Get("get/address-list")
  @ApiOperation({ summary: "Fetch customer shipping address book" })
  async getAddressList() {
    return this.service.getAll();
  }

  @Post("create/address")
  @HttpCode(200)
  @ApiOperation({ summary: "Create an address record" })
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

  @Post("add/address")
  @HttpCode(200)
  @ApiOperation({ summary: "Add new address to customer address book" })
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
  async addAddress(@Body() body: CreateAddressInput) {
    return this.service.create(body);
  }

  @Patch("update/address")
  @ApiOperation({ summary: "Update an existing customer address" })
  async updateAddress(@Body() body: any) {
    const id = Number(body?.id || body?.addressId);
    return this.service.update(id, body);
  }

  @Delete("delete/address/:addressId")
  @ApiOperation({ summary: "Delete address from customer account" })
  async deleteAddress(@Param("addressId") addressId: string) {
    return this.service.deleteById(Number(addressId));
  }
}
