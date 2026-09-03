import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { GateCode } from "../../auth/types/auth.types.js";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { AddressService, type CreateAddressInput } from "./address.service.js";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import type { AuthenticatedTenant } from "../../auth/types/auth.types.js";

@ApiTags("Address")
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller()
export class AddressController {
  constructor(private readonly service: AddressService) {}

  @Get("get/address-list")
  @ApiOperation({ summary: "Fetch customer shipping address book" })
  @RequireGate(GateCode.CODE_CU)
  async getAddressList(@CurrentTenant() tenant?: AuthenticatedTenant) {
    const tid = Number(tenant?.tenantId || tenant?.id);
    return this.service.getAll(Number.isSafeInteger(tid) ? tid : undefined);
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
        addressLine2: { type: "string", example: "Suite 4B" },
        postalCode: { type: "string", example: "110001" },
        city: { type: "string", example: "New Delhi" },
        state: { type: "string", example: "Delhi" },
        country: { type: "string", example: "India" },
        companyName: { type: "string", example: "Anuprerna" },
        primaryPhone: { type: "string", example: "+919999999999" },
        secondaryPhone: { type: "string", example: "+918888888888" },
        contactEmail: { type: "string", format: "email", example: "anant@example.com" },
        vatGstNumber: { type: "string", example: "09BPJPA5148G1ZX" },
        eoriNumber: { type: "string", example: "" },
        addressType: { type: "string", enum: ["BILLING", "SHIPPING"], example: "SHIPPING" },
        primaryBillingAddress: { type: "boolean", example: false },
        primaryShippingAddress: { type: "boolean", example: true },
      },
    },
  })
  @RequireGate(GateCode.CODE_CU)
  async addAddress(@Body() body: CreateAddressInput, @CurrentTenant() tenant?: AuthenticatedTenant) {
    return this.service.create(body, tenant?.tenantId || tenant?.id);
  }

  @Post("update/address")
  @Patch("update/address")
  @HttpCode(200)
  @ApiOperation({ summary: "Update an existing customer address" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", example: 224663, description: "Address ID to update" },
        tenantId: { type: "integer", example: 130439 },
        name: { type: "string", example: "Jane Doe" },
        addressLine1: { type: "string", example: "12 Example Street" },
        addressLine2: { type: "string", example: "Sample Area" },
        postalCode: { type: "string", example: "110001" },
        city: { type: "string", example: "New Delhi" },
        state: { type: "string", example: "Delhi" },
        country: { type: "string", example: "India" },
        companyName: { type: "string", example: "Example Co" },
        primaryPhone: { type: "string", example: "+910000000000" },
        contactEmail: { type: "string", format: "email", example: "jane.doe@example.com" },
        addressType: { type: "string", enum: ["BILLING", "SHIPPING"], example: "SHIPPING" },
        primaryBillingAddress: { type: "boolean", example: false },
        primaryShippingAddress: { type: "boolean", example: true },
      },
    },
  })
  @RequireGate(GateCode.CODE_CU)
  async updateAddress(@CurrentTenant() tenant: AuthenticatedTenant, @Body() body: any) {
    const rawId = body?.id ?? body?.addressId ?? body?.address_id ?? body?.data?.id ?? body?.payload?.id;
    const id = Number(rawId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return { success: false, error: "A valid integer address id is required for update." };
    }
    return this.service.update(id, body, tenant?.tenantId ?? tenant?.id);
  }

  @Delete("delete/address/:addressId")
  @ApiOperation({ summary: "Delete address from customer account" })
  @ApiParam({ name: "addressId", example: 224663, description: "Address ID to delete", type: Number })
  @RequireGate(GateCode.CODE_CU)
  async deleteAddress(@CurrentTenant() tenant: AuthenticatedTenant, @Param("addressId") addressId: string) {
    return this.service.deleteById(Number(addressId), tenant?.tenantId ?? tenant?.id);
  }
}
