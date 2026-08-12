// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from '../service/profile.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import {
  parseAddSizeProfileInput,
  parseUpdateSizeProfileInput,
} from '../dto/profile.dto.js';
import {
  sanitizeAddSizeProfileInput,
  sanitizeUpdateSizeProfileInput,
} from '../validators/profile.sanitizer.js';
import {
  validateAddSizeProfile,
  validateUpdateSizeProfile,
} from '../validators/profile.validator.js';

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class SizeProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('get/size-profile-list')
  @RequireGate(GateCode.CODE_SU)
  async getSizeProfileList() {
    return this.profileService.getSizeProfileList();
  }

  @Get('get/size-profile/:profileId')
  @RequireGate(GateCode.CODE_SU)
  async getSizeProfile(@Param('profileId') profileId: string) {
    return this.profileService.getSizeProfile(Number(profileId));
  }

  @Post('add/size-profile')
  @RequireGate(GateCode.CODE_SU)
  @UseInterceptors(FileInterceptor('image'))
  async addSizeProfile(@Body() body: any, @UploadedFile() file: any) {
    const sanitized = sanitizeAddSizeProfileInput(body);
    const input = parseAddSizeProfileInput(sanitized);
    const error = validateAddSizeProfile(input);
    if (error) throw new BadRequestException(error);
    return this.profileService.addSizeProfile(input, file);
  }

  @Patch('update/size-profile/:profileId')
  @RequireGate(GateCode.CODE_SU)
  async updateSizeProfile(@Param('profileId') profileId: string, @Body() body: any) {
    const sanitized = sanitizeUpdateSizeProfileInput(body);
    const input = parseUpdateSizeProfileInput(sanitized);
    const error = validateUpdateSizeProfile(input);
    if (error) throw new BadRequestException(error);
    return this.profileService.updateSizeProfile(Number(profileId), input);
  }

  @Delete('delete/size-profile/:profileId')
  @RequireGate(GateCode.CODE_SU)
  async deleteSizeProfile(@Param('profileId') profileId: string) {
    return this.profileService.deleteSizeProfile(Number(profileId));
  }

  @Get('get/table-explorer/data/size-profile')
  @RequireGate(GateCode.CODE_SU)
  async exploreSizeProfile(@Query('page') page: string, @Query('size') size: string) {
    return this.profileService.exploreSizeProfile(Number(page) || 0, Number(size) || 10);
  }

  @Get('get/table-explorer/data/size-profile/:id')
  @RequireGate(GateCode.CODE_SU)
  async exploreSizeProfileById(@Param('id') id: string) {
    return this.profileService.exploreSizeProfileById(Number(id));
  }

  @Get('get/table-explorer/data/size-profile-guide')
  @RequireGate(GateCode.CODE_SU)
  async exploreSizeProfileGuide(@Query('page') page: string, @Query('size') size: string) {
    return this.profileService.exploreSizeProfileGuide(Number(page) || 0, Number(size) || 10);
  }

  @Get('get/table-explorer/data/size-profile-option')
  @RequireGate(GateCode.CODE_SU)
  async exploreSizeProfileOption(@Query('page') page: string, @Query('size') size: string) {
    return this.profileService.exploreSizeProfileOption(Number(page) || 0, Number(size) || 10);
  }
}
