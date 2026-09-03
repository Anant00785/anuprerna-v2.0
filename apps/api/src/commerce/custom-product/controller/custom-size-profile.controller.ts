/**
 * Loom: profile/custom_size/controller/CustomSizeProfileController.java
 *
 *   GET    /get/custom-size-profile-list      CODE_SU  key `customSizeProfileList`
 *   GET    /get/custom-size-profile/{id}      CODE_SU  key `customSizeProfile`
 *   POST   /add/custom-size-profile           CODE_SU  {success, message}
 *   PATCH  /update/custom-size-profile        CODE_SU  {success, message}
 *   DELETE /delete/custom-size-profile/{id}   CODE_SU  key `deleteResult`
 *
 * The CMS calls all five (apps/cms/src/lib/profiles-api.ts,
 * app/catalog/profiles/types/CustomSizeProfiles.tsx). The table-explorer
 * variants of these routes are NOT here — they belong to the table-explorer
 * family, which is a separate gap.
 */
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { RolesGuard, RequireGate } from "../../../common/auth/roles.guard.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { keyedResponse, simpleResponse } from "../../../common/response/rain-response.js";
import { CustomSizeProfileRepository } from "../repository/custom-size-profile.repository.js";
import { parseCustomSizeProfile } from "../dto/custom-size-profile.dto.js";

function profileIdParam(raw: string): number {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new BadRequestException("profileId must be a positive integer.");
  }
  return value;
}

@ApiBearerAuth()
@ApiTags("Catalog")
@Controller()
@UseGuards(RolesGuard)
export class CustomSizeProfileController {
  constructor(private readonly repo: CustomSizeProfileRepository) {}

  @Get("/get/custom-size-profile-list")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Every custom size profile, with its measurement fields." })
  @ApiResponse({ status: 200, description: "Custom size profiles." })
  async getCustomSizeProfileList() {
    return keyedResponse("customSizeProfileList", await this.repo.findAll());
  }

  @Get("/get/custom-size-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "One custom size profile." })
  @ApiParam({ name: "profileId", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Custom size profile." })
  async getCustomSizeProfile(@Param("profileId") profileId: string) {
    // Loom's RainResponse renders a missing profile as a null payload, not a 404.
    return keyedResponse("customSizeProfile", await this.repo.findById(profileIdParam(profileId)));
  }

  @Post("/add/custom-size-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Create a custom size profile and its measurement fields." })
  @ApiBody({ description: "profileName, disclaimer, price, customSizeProfileItemList[]" })
  @ApiResponse({ status: 201, description: "New custom size profile created." })
  async addCustomSizeProfile(@Body() body: unknown) {
    await this.repo.create(parseCustomSizeProfile(body, false));
    return simpleResponse(true, "New custom size profile created");
  }

  @Patch("/update/custom-size-profile")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Replace a custom size profile's fields and its whole measurement list." })
  @ApiBody({ description: "id, profileName, disclaimer, price, customSizeProfileItemList[]" })
  @ApiResponse({ status: 200, description: "Custom size profile updated." })
  async updateCustomSizeProfile(@Body() body: unknown) {
    const input = parseCustomSizeProfile(body, true);
    const updated = await this.repo.update({ ...input, id: input.id as number });
    return updated
      ? simpleResponse(true, "Custom size profile updated")
      : simpleResponse(false, "No custom size profile found for the given id");
  }

  @Delete("/delete/custom-size-profile/:profileId")
  @RequireGate(GateCode.CODE_SU)
  @ApiOperation({ summary: "Delete a custom size profile, unless products or sub-categories still use it." })
  @ApiParam({ name: "profileId", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "Deletion result, including any blocking references." })
  async deleteCustomSizeProfile(@Param("profileId") profileId: string) {
    return keyedResponse("deleteResult", await this.repo.remove(profileIdParam(profileId)));
  }
}
