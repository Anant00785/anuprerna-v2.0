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

export class CreateSizeProfileOptionDto {
  @ApiProperty({ example: 109845, description: "Size Profile ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  profileId!: number;

  @ApiProperty({ example: "XL", description: "Size Label" })
  @IsNotEmpty()
  @IsString()
  label!: string;

  @ApiPropertyOptional({ example: "Chest 44 inches", description: "Key Feature" })
  @IsOptional()
  @IsString()
  keyFeature?: string;

  @ApiPropertyOptional({ example: 1, description: "Sort Order" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ example: "2.50", description: "Consumed Fabric in meters" })
  @IsOptional()
  @IsString()
  consumedFabric?: string;
}

export class UpdateSizeProfileOptionDto {
  @ApiProperty({ example: 109861, description: "Size Profile Option ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: "XXL", description: "Size Label" })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: "Chest 46 inches", description: "Key Feature" })
  @IsOptional()
  @IsString()
  keyFeature?: string;

  @ApiPropertyOptional({ example: 2, description: "Sort Order" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ example: "2.80", description: "Consumed Fabric in meters" })
  @IsOptional()
  @IsString()
  consumedFabric?: string;
}

export class CreateSizeProfileGuideDto {
  @ApiProperty({ example: 2644, description: "Size Profile ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  profileId!: number;

  @ApiProperty({ example: 4084, description: "Size Profile Option ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  optionId!: number;

  @ApiProperty({ example: "Bust", description: "Guide measurement name" })
  @IsNotEmpty()
  @IsString()
  guide!: string;

  @ApiProperty({ example: 34, description: "Guide measurement value in inches" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  value!: number;

  @ApiPropertyOptional({ example: 1, description: "Sort Order" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateSizeProfileGuideDto {
  @ApiProperty({ example: 4096, description: "Size Profile Guide ID" })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  id!: number;

  @ApiPropertyOptional({ example: "Chest", description: "Guide measurement name" })
  @IsOptional()
  @IsString()
  guide?: string;

  @ApiPropertyOptional({ example: 36, description: "Guide measurement value in inches" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  value?: number;

  @ApiPropertyOptional({ example: 1, description: "Sort Order" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;
}

export class CreateFinishProfileDto {
  @ApiProperty({ example: "Homeware - Decor - Sofa throw", description: "Profile Name" })
  @IsNotEmpty()
  @IsString()
  profileName!: string;

  @ApiPropertyOptional({ example: "Finishes", description: "Display Name" })
  @IsOptional()
  @IsString()
  displayName?: string;
}

export class UpdateFinishProfileDto {
  @ApiPropertyOptional({ example: 101362, description: "Finish Profile ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ example: "Homeware - Decor - Sofa throw Updated", description: "Profile Name" })
  @IsOptional()
  @IsString()
  profileName?: string;

  @ApiPropertyOptional({ example: "Custom Finishes", description: "Display Name" })
  @IsOptional()
  @IsString()
  displayName?: string;
}

export class UpdateArtisanProfileDto {
  @ApiPropertyOptional({ example: 47916439, description: "Artisan ID" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  id?: number;

  @ApiPropertyOptional({ example: "West Bengal", description: "State" })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: "Mursidabad", description: "District" })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: "Sonarandi, Bonwaribad", description: "Village or Town" })
  @IsOptional()
  @IsString()
  villageTown?: string;

  @ApiPropertyOptional({ example: "742101", description: "Postal Code" })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: "Handloom Weaving", description: "Expertise" })
  @IsOptional()
  @IsString()
  expertise?: string;

  @ApiPropertyOptional({ example: 5, description: "Experience in years" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  experience?: number;

  @ApiPropertyOptional({ example: true, description: "Has WhatsApp" })
  @IsOptional()
  hasWhatsapp?: boolean;
}

function formatSizeProfileOption(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    profileId: r.profileId ? String(r.profileId) : null,
    label: r.label,
    keyFeature: r.keyFeature,
    sortOrder: r.sortOrder ? Number(r.sortOrder) : 0,
    consumedFabric: r.consumedFabric ? String(r.consumedFabric) : null,
  };
}

function formatSizeProfileGuide(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    profileId: r.profileId ? String(r.profileId) : null,
    optionId: r.optionId ? String(r.optionId) : null,
    guide: r.guide,
    value: r.value ? Number(r.value) : 0,
    sortOrder: r.sortOrder ? Number(r.sortOrder) : 0,
  };
}

function formatFinishProfile(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    profileName: r.profileName,
    displayName: r.displayName,
    timeOfCreation: r.timeOfCreation ? Number(r.timeOfCreation) : null,
  };
}

function formatFinishProfileItem(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    version: r.version ? Number(r.version) : 0,
    profileId: r.profileId ? String(r.profileId) : null,
    label: r.label,
    description: r.description,
    image: r.image,
    price: r.price ? Number(r.price) : 0,
  };
}

function formatArtisan(r: any) {
  if (!r) return null;
  return {
    id: r.id ? String(r.id) : null,
    artisanRole: r.artisanRole,
    masterArtisanId: r.masterArtisanId ? String(r.masterArtisanId) : null,
    hasWhatsapp: Boolean(r.hasWhatsapp),
    state: r.state,
    district: r.district,
    villageTown: r.villageTown,
    postalCode: r.postalCode,
    expertise: r.expertise,
    experience: r.experience ? Number(r.experience) : 0,
    hasBankAccount: Boolean(r.hasBankAccount),
    tenantId: r.tenantId ? String(r.tenantId) : null,
  };
}

@ApiTags("Profiles")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class ProfilesDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Post("/add/size-profile-option")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create size option within profile" })
  @ApiBody({ type: CreateSizeProfileOptionDto })
  @ApiResponse({ status: 201, description: "Size option created" })
  async post_add_size_profile_option(@Body() body: CreateSizeProfileOptionDto) {
    // Loom requires the parent profile and label; a missing value is a
    // rejection, never a substitute id or invented measurement.
    if (!body?.profileId) throw new BadRequestException("profileId is required");
    if (!body.label) throw new BadRequestException("label is required");

    const [inserted] = await this.db
      .insert(schema.sizeProfileOption)
      .values({
        profileId: Number(body.profileId),
        label: body.label,
        keyFeature: body.keyFeature ?? "",
        sortOrder: body.sortOrder ?? 0,
        // Column default '0.0' applies when omitted — never invent a consumption.
        ...(body.consumedFabric !== undefined ? { consumedFabric: body.consumedFabric } : {}),
      })
      .returning();
    return keyedResponse("data", inserted ? [formatSizeProfileOption(inserted)] : []);
  }

  @Patch("/update/size-profile-option")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update size option" })
  @ApiBody({ type: UpdateSizeProfileOptionDto })
  @ApiResponse({ status: 200, description: "Size option updated" })
  async patch_update_size_profile_option(@Body() body: UpdateSizeProfileOptionDto) {
    const updateSet: any = {};
    if (body.label) updateSet.label = body.label;
    if (body.keyFeature) updateSet.keyFeature = body.keyFeature;
    if (body.sortOrder !== undefined) updateSet.sortOrder = body.sortOrder;
    if (body.consumedFabric) updateSet.consumedFabric = body.consumedFabric;

    const [updated] = await this.db
      .update(schema.sizeProfileOption)
      .set(updateSet)
      .where(eq(schema.sizeProfileOption.id, BigInt(body.id)))
      .returning();

    return keyedResponse("data", updated ? [formatSizeProfileOption(updated)] : []);
  }

  @Delete("/delete/size-profile-option/:sizeProfileOptionId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete size option" })
  @ApiParam({ name: "sizeProfileOptionId", example: 109861, type: Number })
  @ApiResponse({ status: 200, description: "Size option deleted" })
  async delete_delete_size_profile_option_sizeProfileOptionId(@Param("sizeProfileOptionId") sizeProfileOptionId: string) {
    try {
      await this.db
        .delete(schema.sizeProfileOption)
        .where(eq(schema.sizeProfileOption.id, BigInt(sizeProfileOptionId)));
      return simpleResponse(true, "Size profile option deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete size profile option.");
    }
  }

  @Get("/get/usage/size-profile-option/:sizeProfileOptionId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Check size option product usages" })
  @ApiParam({ name: "sizeProfileOptionId", example: 12562710, type: Number })
  @ApiResponse({ status: 200, description: "Size option product usages" })
  async get_get_usage_size_profile_option_sizeProfileOptionId(@Param("sizeProfileOptionId") sizeProfileOptionId: string) {
    const rows = await this.db
      .select()
      .from(schema.productSizeProfile)
      .where(eq(schema.productSizeProfile.sizeProfileOptionId, Number(sizeProfileOptionId)))
      .limit(20);
    return keyedResponse("data", (rows || []).map(r => ({
      id: String(r.id),
      productId: String(r.productId),
      sku: r.sizeProfileOptionSku,
      quantity: r.quantity,
    })));
  }

  @Post("/add/size-profile-guide")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create size guide document" })
  @ApiBody({ type: CreateSizeProfileGuideDto })
  @ApiResponse({ status: 201, description: "Size guide created" })
  async post_add_size_profile_guide(@Body() body: CreateSizeProfileGuideDto) {
    // No substitute profile/option ids and no invented measurement: reject
    // missing values. A genuine measurement of 0 is kept, not replaced.
    if (!body?.profileId) throw new BadRequestException("profileId is required");
    if (!body.optionId) throw new BadRequestException("optionId is required");
    if (!body.guide) throw new BadRequestException("guide is required");
    if (body.value === undefined || body.value === null) {
      throw new BadRequestException("value is required");
    }

    const [inserted] = await this.db
      .insert(schema.sizeProfileGuide)
      .values({
        profileId: Number(body.profileId),
        optionId: Number(body.optionId),
        guide: body.guide,
        value: body.value,
        sortOrder: body.sortOrder ?? 0,
      })
      .returning();
    return keyedResponse("data", inserted ? [formatSizeProfileGuide(inserted)] : []);
  }

  @Patch("/update/size-profile-guide")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update size guide document" })
  @ApiBody({ type: UpdateSizeProfileGuideDto })
  @ApiResponse({ status: 200, description: "Size guide updated" })
  async patch_update_size_profile_guide(@Body() body: UpdateSizeProfileGuideDto) {
    const updateSet: any = {};
    if (body.guide) updateSet.guide = body.guide;
    if (body.value !== undefined) updateSet.value = body.value;
    if (body.sortOrder !== undefined) updateSet.sortOrder = body.sortOrder;

    const [updated] = await this.db
      .update(schema.sizeProfileGuide)
      .set(updateSet)
      .where(eq(schema.sizeProfileGuide.id, BigInt(body.id)))
      .returning();

    return keyedResponse("data", updated ? [formatSizeProfileGuide(updated)] : []);
  }

  @Delete("/delete/size-profile-guide/:sizeProfileGuideId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete size guide document" })
  @ApiParam({ name: "sizeProfileGuideId", example: 4096, type: Number })
  @ApiResponse({ status: 200, description: "Size guide deleted" })
  async delete_delete_size_profile_guide_sizeProfileGuideId(@Param("sizeProfileGuideId") sizeProfileGuideId: string) {
    try {
      await this.db
        .delete(schema.sizeProfileGuide)
        .where(eq(schema.sizeProfileGuide.id, BigInt(sizeProfileGuideId)));
      return simpleResponse(true, "Size profile guide deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete size profile guide.");
    }
  }

  @Get("/get/finish-profile-list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch fabric finish profiles" })
  @ApiResponse({ status: 200, description: "Fabric finish profiles" })
  async get_get_finish_profile_list() {
    const rows = await this.db
      .select()
      .from(schema.finishProfile)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatFinishProfile));
  }

  @Get("/get/finish-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch finish profile detail" })
  @ApiParam({ name: "profileId", example: 101362, type: Number })
  @ApiResponse({ status: 200, description: "Finish profile detail" })
  async get_get_finish_profile_profileId(@Param("profileId") profileId: string) {
    const rows = await this.db
      .select()
      .from(schema.finishProfile)
      .where(eq(schema.finishProfile.id, BigInt(profileId)));
    return keyedResponse("data", (rows || []).map(formatFinishProfile));
  }

  @Post("/add/finish-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create finish profile" })
  @ApiBody({ type: CreateFinishProfileDto })
  @ApiResponse({ status: 201, description: "Finish profile created" })
  async post_add_finish_profile(@Body() body: CreateFinishProfileDto) {
    const [inserted] = await this.db
      .insert(schema.finishProfile)
      .values({
        profileName: body.profileName || "Custom Finish Profile",
        displayName: body.displayName || "Finishes",
        timeOfCreation: Date.now(),
      })
      .returning();
    return keyedResponse("data", inserted ? [formatFinishProfile(inserted)] : []);
  }

  @Patch("/update/finish-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update finish profile" })
  @ApiParam({ name: "profileId", example: 101362, type: Number })
  @ApiBody({ type: UpdateFinishProfileDto })
  @ApiResponse({ status: 200, description: "Finish profile updated" })
  async patch_update_finish_profile_profileId(@Param("profileId") profileId: string, @Body() body: UpdateFinishProfileDto) {
    const updateSet: any = {};
    if (body.profileName) updateSet.profileName = body.profileName;
    if (body.displayName) updateSet.displayName = body.displayName;

    const [updated] = await this.db
      .update(schema.finishProfile)
      .set(updateSet)
      .where(eq(schema.finishProfile.id, BigInt(profileId)))
      .returning();

    return keyedResponse("data", updated ? [formatFinishProfile(updated)] : []);
  }

  @Delete("/delete/finish-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete finish profile" })
  @ApiParam({ name: "profileId", example: 101362, type: Number })
  @ApiResponse({ status: 200, description: "Finish profile deleted" })
  async delete_delete_finish_profile_profileId(@Param("profileId") profileId: string) {
    try {
      await this.db
        .delete(schema.finishProfile)
        .where(eq(schema.finishProfile.id, BigInt(profileId)));
      return simpleResponse(true, "Finish profile deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete finish profile.");
    }
  }

  @Get("/get/usage/finish-profile-item/:finishItemId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Check finish item usages" })
  @ApiParam({ name: "finishItemId", example: 99714, type: Number })
  @ApiResponse({ status: 200, description: "Finish item usages" })
  async get_get_usage_finish_profile_item_finishItemId(@Param("finishItemId") finishItemId: string) {
    const rows = await this.db
      .select()
      .from(schema.finishProfileItem)
      .where(eq(schema.finishProfileItem.id, BigInt(finishItemId)));
    return keyedResponse("data", (rows || []).map(formatFinishProfileItem));
  }

  @Delete("/delete/finish-profile-item/:finishItemId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete finish profile item" })
  @ApiParam({ name: "finishItemId", example: 99714, type: Number })
  @ApiResponse({ status: 200, description: "Finish profile item deleted" })
  async delete_delete_finish_profile_item_finishItemId(@Param("finishItemId") finishItemId: string) {
    try {
      await this.db
        .delete(schema.finishProfileItem)
        .where(eq(schema.finishProfileItem.id, BigInt(finishItemId)));
      return simpleResponse(true, "Finish profile item deleted successfully.");
    } catch (err) {
      return simpleResponse(false, "Failed to delete finish profile item.");
    }
  }

  @Get("/get/artisan/profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Retrieve active artisan profile" })
  @ApiResponse({ status: 200, description: "Artisan profile" })
  async get_get_artisan_profile() {
    const rows = await this.db
      .select()
      .from(schema.artisan)
      .limit(10);
    return keyedResponse("data", (rows || []).map(formatArtisan));
  }

  @Patch("/update/artisan/profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update artisan self-profile" })
  @ApiBody({ type: UpdateArtisanProfileDto })
  @ApiResponse({ status: 200, description: "Artisan profile updated" })
  async patch_update_artisan_profile(@Body() body: UpdateArtisanProfileDto) {
    // Never fall back to a real artisan's id: an update without an id is a
    // rejection, not a write against row 47916439.
    if (!body?.id) throw new BadRequestException("Artisan ID is required");

    const updateSet: Partial<typeof schema.artisan.$inferInsert> = {
      lastUpdateTime: Date.now(),
    };
    if (body.state) updateSet.state = body.state;
    if (body.district) updateSet.district = body.district;
    if (body.villageTown) updateSet.villageTown = body.villageTown;
    if (body.postalCode) updateSet.postalCode = body.postalCode;
    if (body.expertise) updateSet.expertise = body.expertise;
    if (body.experience !== undefined) updateSet.experience = body.experience;
    if (body.hasWhatsapp !== undefined) updateSet.hasWhatsapp = body.hasWhatsapp;

    const [updated] = await this.db
      .update(schema.artisan)
      .set(updateSet)
      .where(eq(schema.artisan.id, BigInt(body.id)))
      .returning();

    return keyedResponse("data", updated ? [formatArtisan(updated)] : []);
  }

  @Get("/get/table-explorer/data/finish-profile-item/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect FinishProfileItem entity by ID" })
  @ApiParam({ name: "id", example: 99714, type: Number })
  async get_get_table_explorer_data_finish_profile_item_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.finishProfileItem)
      .where(eq(schema.finishProfileItem.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatFinishProfileItem));
  }

  @Get("/get/table-explorer/data/size-profile-guide/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect SizeProfileGuide entity by ID" })
  @ApiParam({ name: "id", example: 4096, type: Number })
  async get_get_table_explorer_data_size_profile_guide_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.sizeProfileGuide)
      .where(eq(schema.sizeProfileGuide.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatSizeProfileGuide));
  }

  @Get("/get/table-explorer/data/size-profile-option/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect SizeProfileOption entity by ID" })
  @ApiParam({ name: "id", example: 109861, type: Number })
  async get_get_table_explorer_data_size_profile_option_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.sizeProfileOption)
      .where(eq(schema.sizeProfileOption.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatSizeProfileOption));
  }

  @Get("/get/table-explorer/data/finish-profile/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect FinishProfile entity by ID" })
  @ApiParam({ name: "id", example: 101362, type: Number })
  async get_get_table_explorer_data_finish_profile_id(@Param("id") id: string) {
    const rows = await this.db
      .select()
      .from(schema.finishProfile)
      .where(eq(schema.finishProfile.id, BigInt(id)));
    return keyedResponse("data", (rows || []).map(formatFinishProfile));
  }

  @Get("/get/table-explorer/data/finish-profile-item")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch all finish profile items" })
  async get_get_table_explorer_data_finish_profile_item() {
    const rows = await this.db
      .select()
      .from(schema.finishProfileItem)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatFinishProfileItem));
  }

  @Get("/get/table-explorer/data/finish-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Fetch all finish profiles" })
  async get_get_table_explorer_data_finish_profile() {
    const rows = await this.db
      .select()
      .from(schema.finishProfile)
      .limit(50);
    return keyedResponse("data", (rows || []).map(formatFinishProfile));
  }
}
