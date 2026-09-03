import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  UseGuards,
  NotFoundException,
  BadRequestException
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags
} from "@nestjs/swagger";
import * as schema from "../../database/schema/schema.js";
import { eq, desc, asc, sql } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { GateCode } from "../../auth/types/auth.types.js";
import {
  CreateFabricProfileDto,
  UpdateFabricProfileDto,
  FabricProfileItemInputDto
} from "../profile/dto/fabric-profile.dto.js";

@ApiTags("Fabric Profile")
@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class FabricProductMigratedDomainController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  @Get("/get/fabric-profile-list")
  @ApiOperation({ summary: "Fetch fabric specification profiles" })
  @ApiResponse({ status: 200, description: "List of all fabric profiles with items" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_fabric_profile_list(@Query() query: any) {
    try {
      const profiles = await this.db
        .select()
        .from(schema.fabricProfile)
        .orderBy(desc(schema.fabricProfile.id));

      const items = await this.db
        .select()
        .from(schema.fabricProfileItem);

      const itemsByProfile = new Map<number, any[]>();
      for (const item of items) {
        const pId = Number(item.profileId);
        if (!itemsByProfile.has(pId)) {
          itemsByProfile.set(pId, []);
        }
        itemsByProfile.get(pId)!.push({
          id: Number(item.id),
          version: Number(item.version),
          profileId: Number(item.profileId),
          productId: Number(item.productId),
          fabricId: Number(item.productId),
          mockupImage: item.mockupImage,
          mockupText: item.mockupText
        });
      }

      const enriched = profiles.map(p => ({
        id: Number(p.id),
        version: Number(p.version),
        profileName: p.profileName,
        timeOfCreation: Number(p.timeOfCreation),
        fabricProfileItemList: itemsByProfile.get(Number(p.id)) || []
      }));

      return keyedResponse("fabricProfileList", enriched);
    } catch (err) {
      return keyedResponse("fabricProfileList", []);
    }
  }

  @Get("/get/fabric-profile/:profileId")
  @ApiOperation({ summary: "Fetch fabric profile detail" })
  @ApiParam({ name: "profileId", description: "Fabric Profile ID", example: 1 })
  @ApiResponse({ status: 200, description: "Fabric profile entity with items" })
  @RequireGate(GateCode.CODE_SU)
  async get_get_fabric_profile_profileId(@Param("profileId") profileId: string) {
    const id = Number(profileId);
    if (!id) {
      throw new BadRequestException("Invalid fabric profile ID");
    }

    const [profile] = await this.db
      .select()
      .from(schema.fabricProfile)
      .where(eq(schema.fabricProfile.id, BigInt(id)))
      .limit(1);

    if (!profile) {
      throw new NotFoundException("Fabric profile not found");
    }

    const items = await this.db
      .select()
      .from(schema.fabricProfileItem)
      .where(eq(schema.fabricProfileItem.profileId, id));

    const enriched = {
      id: Number(profile.id),
      version: Number(profile.version),
      profileName: profile.profileName,
      timeOfCreation: Number(profile.timeOfCreation),
      fabricProfileItemList: items.map(item => ({
        id: Number(item.id),
        version: Number(item.version),
        profileId: Number(item.profileId),
        productId: Number(item.productId),
        fabricId: Number(item.productId),
        mockupImage: item.mockupImage,
        mockupText: item.mockupText
      }))
    };

    return keyedResponse("fabricProfile", enriched);
  }

  @Post("/add/fabric-profile")
  @RequireGate(GateCode.CODE_SU)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create fabric profile" })
  @ApiBody({ type: CreateFabricProfileDto })
  @ApiResponse({ status: 201, description: "Fabric profile created successfully" })
  async post_add_fabric_profile(@Body() body: CreateFabricProfileDto) {
    if (!body || !body.profileName) {
      throw new BadRequestException("Profile name is required");
    }

    const now = Date.now();
    const [createdProfile] = await this.db
      .insert(schema.fabricProfile)
      .values({
        profileName: body.profileName,
        timeOfCreation: now
      })
      .returning();

    const profileId = Number(createdProfile.id);
    const createdItems: any[] = [];

    if (body.fabricProfileItemList && Array.isArray(body.fabricProfileItemList)) {
      for (const item of body.fabricProfileItemList) {
        const prodId = Number(item.fabricId || 0);
        if (prodId > 0) {
          const [insertedItem] = await this.db
            .insert(schema.fabricProfileItem)
            .values({
              profileId,
              productId: prodId,
              mockupImage: item.mockupImage || "",
              mockupText: item.mockupText || ""
            })
            .returning();
          createdItems.push({
            id: Number(insertedItem.id),
            version: Number(insertedItem.version),
            profileId,
            productId: prodId,
            fabricId: prodId,
            mockupImage: insertedItem.mockupImage,
            mockupText: insertedItem.mockupText
          });
        }
      }
    }

    const result = {
      id: profileId,
      version: Number(createdProfile.version),
      profileName: createdProfile.profileName,
      timeOfCreation: Number(createdProfile.timeOfCreation),
      fabricProfileItemList: createdItems
    };

    return keyedResponse("fabricProfile", result);
  }

  @Patch("/update/fabric-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Update fabric profile" })
  @ApiParam({ name: "profileId", description: "Fabric Profile ID", example: 1 })
  @ApiBody({ type: UpdateFabricProfileDto })
  @ApiResponse({ status: 200, description: "Fabric profile updated successfully" })
  async patch_update_fabric_profile_profileId(
    @Param("profileId") profileId: string,
    @Body() body: UpdateFabricProfileDto
  ) {
    const id = Number(profileId);
    if (!id) {
      throw new BadRequestException("Invalid fabric profile ID");
    }

    const [existingProfile] = await this.db
      .select()
      .from(schema.fabricProfile)
      .where(eq(schema.fabricProfile.id, BigInt(id)))
      .limit(1);

    if (!existingProfile) {
      throw new NotFoundException("Fabric profile not found");
    }

    const [updatedProfile] = await this.db
      .update(schema.fabricProfile)
      .set({
        profileName: body.profileName || existingProfile.profileName
      })
      .where(eq(schema.fabricProfile.id, BigInt(id)))
      .returning();

    if (body.fabricProfileItemList && Array.isArray(body.fabricProfileItemList)) {
      for (const item of body.fabricProfileItemList) {
        const itemId = Number(item.id || 0);
        const prodId = Number(item.fabricId || 0);

        if (itemId > 0) {
          await this.db
            .update(schema.fabricProfileItem)
            .set({
              ...(prodId > 0 ? { productId: prodId } : {}),
              mockupImage: item.mockupImage !== undefined ? item.mockupImage : undefined,
              mockupText: item.mockupText !== undefined ? item.mockupText : undefined
            })
            .where(eq(schema.fabricProfileItem.id, BigInt(itemId)));
        } else if (prodId > 0) {
          await this.db
            .insert(schema.fabricProfileItem)
            .values({
              profileId: id,
              productId: prodId,
              mockupImage: item.mockupImage || "",
              mockupText: item.mockupText || ""
            });
        }
      }
    }

    const currentItems = await this.db
      .select()
      .from(schema.fabricProfileItem)
      .where(eq(schema.fabricProfileItem.profileId, id));

    const result = {
      id: Number(updatedProfile.id),
      version: Number(updatedProfile.version),
      profileName: updatedProfile.profileName,
      timeOfCreation: Number(updatedProfile.timeOfCreation),
      fabricProfileItemList: currentItems.map(it => ({
        id: Number(it.id),
        version: Number(it.version),
        profileId: Number(it.profileId),
        productId: Number(it.productId),
        fabricId: Number(it.productId),
        mockupImage: it.mockupImage,
        mockupText: it.mockupText
      }))
    };

    return keyedResponse("fabricProfile", result);
  }

  @Delete("/delete/fabric-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete fabric profile" })
  @ApiParam({ name: "profileId", description: "Fabric Profile ID", example: 1 })
  @ApiResponse({ status: 200, description: "Fabric profile deletion result" })
  async delete_delete_fabric_profile_profileId(@Param("profileId") profileId: string) {
    const id = Number(profileId);
    if (!id) {
      throw new BadRequestException("Invalid fabric profile ID");
    }

    // Check if fabric profile is associated with products
    const associatedProducts = await this.db
      .select({ sku: schema.product.sku })
      .from(schema.product)
      .where(eq(schema.product.fabricProfileId, id));

    if (associatedProducts && associatedProducts.length > 0) {
      return keyedResponse("profileDelete", {
        status: false,
        message: `Fabric profile has ${associatedProducts.length} products associated. Cannot be deleted.`,
        skuList: associatedProducts.map(p => p.sku),
        subCategoryCount: 0
      });
    }

    // Delete child items first
    await this.db
      .delete(schema.fabricProfileItem)
      .where(eq(schema.fabricProfileItem.profileId, id));

    // Delete profile
    await this.db
      .delete(schema.fabricProfile)
      .where(eq(schema.fabricProfile.id, BigInt(id)));

    return keyedResponse("profileDelete", {
      status: true,
      message: "Fabric profile deleted.",
      skuList: [],
      subCategoryCount: 0
    });
  }

  @Delete("/delete/fabric-profile-item/:profileItemId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete item from fabric profile" })
  @ApiParam({ name: "profileItemId", description: "Fabric Profile Item ID", example: 1 })
  @ApiResponse({ status: 200, description: "Fabric profile item deleted" })
  async delete_delete_fabric_profile_item_profileItemId(@Param("profileItemId") profileItemId: string) {
    const id = Number(profileItemId);
    if (!id) {
      throw new BadRequestException("Invalid profile item ID");
    }

    await this.db
      .delete(schema.fabricProfileItem)
      .where(eq(schema.fabricProfileItem.id, BigInt(id)));

    return simpleResponse(true, "Fabric profile item deleted.");
  }

  @Get("/get/table-explorer/data/fabric-profile-item/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect FabricProfileItem entity by ID" })
  @ApiParam({ name: "id", description: "Fabric Profile Item ID", example: 1 })
  async get_get_table_explorer_data_fabric_profile_item_id(@Param("id") id: string) {
    const [result] = await this.db
      .select()
      .from(schema.fabricProfileItem)
      .where(eq(schema.fabricProfileItem.id, BigInt(id)))
      .limit(1);
    return keyedResponse("data", result || null);
  }

  @Get("/get/table-explorer/data/fabric-profile/:id")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Inspect FabricProfile entity by ID" })
  @ApiParam({ name: "id", description: "Fabric Profile ID", example: 1 })
  async get_get_table_explorer_data_fabric_profile_id(@Param("id") id: string) {
    const [result] = await this.db
      .select()
      .from(schema.fabricProfile)
      .where(eq(schema.fabricProfile.id, BigInt(id)))
      .limit(1);
    return keyedResponse("data", result || null);
  }

  @Get("/get/table-explorer/data/fabric-profile-item")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated FabricProfileItem explorer list" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "size", required: false, example: 50 })
  async get_get_table_explorer_data_fabric_profile_item(@Query() query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.max(1, Math.min(100, Number(query?.size) || 50));
    const offset = (page - 1) * size;

    const result = await this.db
      .select()
      .from(schema.fabricProfileItem)
      .limit(size)
      .offset(offset);
    return keyedResponse("data", result || []);
  }

  @Get("/get/table-explorer/data/fabric-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Paginated FabricProfile explorer list" })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "size", required: false, example: 50 })
  async get_get_table_explorer_data_fabric_profile(@Query() query: any) {
    const page = Math.max(1, Number(query?.page) || 1);
    const size = Math.max(1, Math.min(100, Number(query?.size) || 50));
    const offset = (page - 1) * size;

    const result = await this.db
      .select()
      .from(schema.fabricProfile)
      .limit(size)
      .offset(offset);
    return keyedResponse("data", result || []);
  }
}
