import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Inject,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import * as schema from "../../database/schema/schema.js";
import { eq, desc } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";

export class CreateVolumeDiscountProfileDto {
  @ApiProperty({ example: "Wholesale Tier Discount", description: "Profile Name" })
  @IsNotEmpty()
  @IsString()
  profileName!: string;

  @ApiPropertyOptional({ example: "Volume discounts for bulk orders over 50 meters.", description: "Disclaimer" })
  @IsOptional()
  @IsString()
  disclaimer?: string;
}

export class UpdateVolumeDiscountProfileDto {
  @ApiProperty({ example: 2605, description: "Volume Discount Profile ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: "Custom Products Tier Discount", description: "Profile Name" })
  @IsOptional()
  @IsString()
  profileName?: string;

  @ApiPropertyOptional({ example: "Updated volume discount terms and conditions.", description: "Disclaimer" })
  @IsOptional()
  @IsString()
  disclaimer?: string;
}

export class CreateDiscountCouponDto {
  @ApiProperty({ example: "FESTIVE20", description: "Coupon Code" })
  @IsNotEmpty()
  @IsString()
  couponCode!: string;

  @ApiProperty({ example: 20.0, description: "Discount percentage" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  discountPercentage!: number;

  @ApiPropertyOptional({ example: 2000, description: "Minimum order value in INR" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minimumOrderValue?: number;

  @ApiPropertyOptional({ example: "PERCENTAGE_OFF", enum: ["PERCENTAGE_OFF", "FREE_SHIPPING"] })
  @IsOptional()
  @IsString()
  discountType?: string;

  @ApiPropertyOptional({ example: "MANUAL", enum: ["AUTOMATIC", "MANUAL"] })
  @IsOptional()
  @IsString()
  discountMethod?: string;

  @ApiPropertyOptional({ example: "DOMESTIC", enum: ["DOMESTIC", "INTERNATIONAL"] })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: "MULTIPLE", enum: ["SINGLE", "MULTIPLE"] })
  @IsOptional()
  @IsString()
  usageType?: string;

  @ApiProperty({ example: 1756857600000, description: "Validity start (epoch ms)" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  startDate!: number;

  @ApiPropertyOptional({ example: 1759449600000, description: "Validity end (epoch ms); 0/omitted = no expiry" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  endDate?: number;

  @ApiPropertyOptional({ example: true, description: "Active status" })
  @IsOptional()
  active?: boolean;
}

export class UpdateDiscountCouponDto {
  @ApiProperty({ example: 1, description: "Discount ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: "FESTIVE25", description: "Coupon Code" })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ example: 25.0, description: "Discount percentage" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  discountPercentage?: number;

  @ApiPropertyOptional({ example: 2500, description: "Minimum order value in INR" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minimumOrderValue?: number;

  @ApiPropertyOptional({ example: true, description: "Active status" })
  @IsOptional()
  active?: boolean;
}

function formatVolumeDiscountProfile(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    profileName: r.profileName,
    disclaimer: r.disclaimer,
    timeOfCreation: r.timeOfCreation ? Number(r.timeOfCreation) : null,
  };
}

function formatVolumeDiscountProfileItem(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    profileId: r.profileId ? String(r.profileId) : null,
    minimumOrderQuantity: r.minimumOrderQuantity ? Number(r.minimumOrderQuantity) : 0,
    discount: r.discount ? String(r.discount) : "0",
    preOrder: Boolean(r.preOrder),
    advancePayment: r.advancePayment ? String(r.advancePayment) : "0",
    deliveryFromDays: r.deliveryFromDays ? Number(r.deliveryFromDays) : 0,
    deliveryToDays: r.deliveryToDays ? Number(r.deliveryToDays) : 0,
  };
}

function formatDiscount(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    discountType: r.discountType,
    discountMethod: r.discountMethod,
    discountPercentage: r.discountPercentage ? Number(r.discountPercentage) : 0,
    minimumOrderValue: r.minimumOrderValue ? Number(r.minimumOrderValue) : 0,
    location: r.location,
    startDate: r.startDate ? Number(r.startDate) : null,
    endDate: r.endDate ? Number(r.endDate) : null,
    couponCode: r.couponCode,
    usageType: r.usageType,
    active: Boolean(r.active),
  };
}

@ApiTags("Discount")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class DiscountMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Get("/get/volume-discount-profile-list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch tier volume discount profiles" })
  @ApiResponse({ status: 200, description: "Volume discount profiles list" })
  async get_get_volume_discount_profile_list() {
    const rows = await (this.db as any)
      .select()
      .from(schema.volumeDiscountProfile)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatVolumeDiscountProfile));
  }

  @Get("/get/volume-discount-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch volume discount profile detail" })
  @ApiParam({ name: "profileId", example: 2605, type: Number })
  @ApiResponse({ status: 200, description: "Volume discount profile detail" })
  async get_get_volume_discount_profile_profileId(@Param("profileId") profileId: string) {
    const rows = await (this.db as any)
      .select()
      .from(schema.volumeDiscountProfile)
      .where(eq(schema.volumeDiscountProfile.id, BigInt(profileId)));
    return keyedResponse("data", (rows || []).map(formatVolumeDiscountProfile));
  }

  @Post("/add/volume-discount-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create volume discount profile" })
  @ApiBody({ type: CreateVolumeDiscountProfileDto })
  @ApiResponse({ status: 201, description: "Volume discount profile created" })
  async post_add_volume_discount_profile(@Body() body: CreateVolumeDiscountProfileDto) {
    const [inserted] = await (this.db as any)
      .insert(schema.volumeDiscountProfile)
      .values({
        profileName: body.profileName || "Wholesale Tier Discount",
        disclaimer: body.disclaimer || "Volume discount terms apply.",
        timeOfCreation: BigInt(Date.now()),
      })
      .returning();
    return keyedResponse("data", inserted ? [formatVolumeDiscountProfile(inserted)] : []);
  }

  @Patch("/update/volume-discount-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update volume discount profile" })
  @ApiBody({ type: UpdateVolumeDiscountProfileDto })
  @ApiResponse({ status: 200, description: "Volume discount profile updated" })
  async patch_update_volume_discount_profile(@Body() body: UpdateVolumeDiscountProfileDto) {
    const updateSet: any = {};
    if (body.profileName) updateSet.profileName = body.profileName;
    if (body.disclaimer) updateSet.disclaimer = body.disclaimer;

    const [updated] = await (this.db as any)
      .update(schema.volumeDiscountProfile)
      .set(updateSet)
      .where(eq(schema.volumeDiscountProfile.id, BigInt(body.id)))
      .returning();

    return keyedResponse("data", updated ? [formatVolumeDiscountProfile(updated)] : []);
  }

  @Delete("/delete/volume-discount-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete volume discount profile" })
  @ApiParam({ name: "profileId", example: 2605, type: Number })
  @ApiResponse({ status: 200, description: "Volume discount profile deleted" })
  async delete_delete_volume_discount_profile_profileId(@Param("profileId") profileId: string) {
    try {
      await (this.db as any)
        .delete(schema.volumeDiscountProfile)
        .where(eq(schema.volumeDiscountProfile.id, BigInt(profileId)));
      return simpleResponse(true, "Volume discount profile deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete volume discount profile.");
    }
  }

  @Get("/get/discount-list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch coupon discounts list" })
  @ApiResponse({ status: 200, description: "Discount coupons list" })
  async get_get_discount_list() {
    try {
      const rows = await (this.db as any)
        .select()
        .from(schema.discount)
        .orderBy(desc(schema.discount.id))
        .limit(50);
      return keyedResponse("data", (rows || []).map(formatDiscount));
    } catch (err) {
      return keyedResponse("data", []);
    }
  }

  @Get("/get/discount/:discountId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch discount coupon detail" })
  @ApiParam({ name: "discountId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Discount coupon detail" })
  async get_get_discount_discountId(@Param("discountId") discountId: string) {
    const rows = await (this.db as any)
      .select()
      .from(schema.discount)
      .where(eq(schema.discount.id, BigInt(discountId)));
    return keyedResponse("data", (rows || []).map(formatDiscount));
  }

  @Post("/add/discount")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create discount coupon" })
  @ApiBody({ type: CreateDiscountCouponDto })
  @ApiResponse({ status: 201, description: "Discount coupon created" })
  async post_add_discount(@Body() body: CreateDiscountCouponDto) {
    // Loom's DiscountAddValidator requires a valid type/method/location/usage
    // and a real date range from the caller. Nothing here is invented: a
    // genuine 0% discount or 0 minimum survives, and a missing money value,
    // coupon code or start date is a 400 — never FESTIVE20/20%/1000/+30 days.
    if (!body?.couponCode) throw new BadRequestException("couponCode is required");
    if (body.discountPercentage === undefined || body.discountPercentage === null) {
      throw new BadRequestException("discountPercentage is required");
    }
    if (body.minimumOrderValue === undefined || body.minimumOrderValue === null) {
      throw new BadRequestException("minimumOrderValue is required");
    }
    if (!body.discountType) throw new BadRequestException("discountType is required");
    if (!body.discountMethod) throw new BadRequestException("discountMethod is required");
    if (!body.location) throw new BadRequestException("location is required");
    if (!body.usageType) throw new BadRequestException("usageType is required");
    if (!body.startDate) throw new BadRequestException("startDate is required");

    const [inserted] = await (this.db as any)
      .insert(schema.discount)
      .values({
        couponCode: body.couponCode,
        discountPercentage: body.discountPercentage,
        minimumOrderValue: body.minimumOrderValue,
        discountType: body.discountType,
        discountMethod: body.discountMethod,
        location: body.location,
        usageType: body.usageType,
        startDate: BigInt(body.startDate),
        // endDate 0 = no expiry (column default in the legacy schema).
        endDate: BigInt(body.endDate ?? 0),
        active: body.active !== undefined ? body.active : true,
      })
      .returning();
    return keyedResponse("data", inserted ? [formatDiscount(inserted)] : []);
  }

  @Patch("/update/discount")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update discount coupon" })
  @ApiBody({ type: UpdateDiscountCouponDto })
  @ApiResponse({ status: 200, description: "Discount coupon updated" })
  async patch_update_discount(@Body() body: UpdateDiscountCouponDto) {
    const updateSet: any = {};
    if (body.couponCode) updateSet.couponCode = body.couponCode;
    if (body.discountPercentage !== undefined) updateSet.discountPercentage = body.discountPercentage;
    if (body.minimumOrderValue !== undefined) updateSet.minimumOrderValue = body.minimumOrderValue;
    if (body.active !== undefined) updateSet.active = body.active;

    const [updated] = await (this.db as any)
      .update(schema.discount)
      .set(updateSet)
      .where(eq(schema.discount.id, BigInt(body.id)))
      .returning();

    return keyedResponse("data", updated ? [formatDiscount(updated)] : []);
  }

  @Delete("/delete/discount/:discountId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete discount coupon" })
  @ApiParam({ name: "discountId", example: 1, type: Number })
  @ApiResponse({ status: 200, description: "Discount coupon deleted" })
  async delete_delete_discount_discountId(@Param("discountId") discountId: string) {
    try {
      await (this.db as any)
        .delete(schema.discount)
        .where(eq(schema.discount.id, BigInt(discountId)));
      return simpleResponse(true, "Discount coupon deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete discount coupon.");
    }
  }

  @Get("/get/table-explorer/data/volume-discount-profile-item/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect VolumeDiscountProfileItem entity by ID" })
  @ApiParam({ name: "id", example: 54485942, type: Number })
  async get_get_table_explorer_data_volume_discount_profile_item_id(@Param("id") id: string) {
    const rows = await (this.db as any)
      .select()
      .from(schema.volumeDiscountProfileItem)
      .where(eq(schema.volumeDiscountProfileItem.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatVolumeDiscountProfileItem));
  }

  @Get("/get/table-explorer/data/volume-discount-profile/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect VolumeDiscountProfile entity by ID" })
  @ApiParam({ name: "id", example: 2605, type: Number })
  async get_get_table_explorer_data_volume_discount_profile_id(@Param("id") id: string) {
    const rows = await (this.db as any)
      .select()
      .from(schema.volumeDiscountProfile)
      .where(eq(schema.volumeDiscountProfile.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatVolumeDiscountProfile));
  }

  @Get("/get/table-explorer/data/discount")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for discount coupons" })
  async get_get_table_explorer_data_discount() {
    const rows = await (this.db as any)
      .select()
      .from(schema.discount)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatDiscount));
  }

  @Get("/get/table-explorer/data/volume-discount-profile-item")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for volume discount profile items" })
  async get_get_table_explorer_data_volume_discount_profile_item() {
    const rows = await (this.db as any)
      .select()
      .from(schema.volumeDiscountProfileItem)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatVolumeDiscountProfileItem));
  }

  @Get("/get/table-explorer/data/volume-discount-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Table explorer data for volume discount profiles" })
  async get_get_table_explorer_data_volume_discount_profile() {
    const rows = await (this.db as any)
      .select()
      .from(schema.volumeDiscountProfile)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatVolumeDiscountProfile));
  }
}
