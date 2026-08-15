// @ts-nocheck
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ProfileService } from '../service/profile.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import {
  parseAddBadgeProfileInput,
  parseUpdateBadgeProfileInput,
} from '../dto/profile.dto.js';
import {
  sanitizeAddBadgeProfileInput,
  sanitizeUpdateBadgeProfileInput,
} from '../validators/profile.sanitizer.js';
import {
  validateAddBadgeProfile,
  validateUpdateBadgeProfile,
} from '../validators/profile.validator.js';

@ApiBearerAuth()
@ApiTags("Profiles")
@Controller()
@UseGuards(RolesGuard)
export class BadgeProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('get/badge-profile-list')
  async getBadgeProfileList() {
    return this.profileService.getBadgeProfileList();
  }

  @Get('get/badge-profile/:profileId')
  async getBadgeProfile(@Param('profileId') profileId: string) {
    return this.profileService.getBadgeProfile(Number(profileId));
  }

  @Post('add/badge-profile')
  @RequireGate(GateCode.CODE_SU)
  async addBadgeProfile(@Body() body: any) {
    const sanitized = sanitizeAddBadgeProfileInput(body);
    const input = parseAddBadgeProfileInput(sanitized);
    const error = validateAddBadgeProfile(input);
    if (error) throw new BadRequestException(error);
    return this.profileService.addBadgeProfile(input);
  }

  @Patch('update/badge-profile/:profileId')
  @RequireGate(GateCode.CODE_SU)
  async updateBadgeProfile(@Param('profileId') profileId: string, @Body() body: any) {
    const sanitized = sanitizeUpdateBadgeProfileInput(body);
    const input = parseUpdateBadgeProfileInput(sanitized);
    const error = validateUpdateBadgeProfile(input);
    if (error) throw new BadRequestException(error);
    return this.profileService.updateBadgeProfile(Number(profileId), input);
  }

  @Delete('delete/badge-profile/:profileId')
  @RequireGate(GateCode.CODE_SU)
  async deleteBadgeProfile(@Param('profileId') profileId: string) {
    return this.profileService.deleteBadgeProfile(Number(profileId));
  }

  @Get('get/table-explorer/data/badge-profile')
  async exploreBadgeProfile(@Query('page') page: string, @Query('size') size: string) {
    return this.profileService.exploreBadgeProfile(Number(page) || 0, Number(size) || 10);
  }

  @Get('get/table-explorer/data/badge-profile/:id')
  async exploreBadgeProfileById(@Param('id') id: string) {
    return this.profileService.getBadgeProfile(Number(id));
  }

  @Get('get/table-explorer/data/badge-profile-item')
  async exploreBadgeProfileItem(@Query('page') page: string, @Query('size') size: string) {
    return this.profileService.exploreBadgeProfileItem(Number(page) || 0, Number(size) || 10);
  }
}
