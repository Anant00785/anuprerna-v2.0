import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ProfileService } from '../service/profile.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import {
  parseAddMadeToOrderProfileInput,
  parseUpdateMadeToOrderProfileInput,
} from '../dto/profile.dto.js';
import {
  sanitizeAddMadeToOrderProfileInput,
  sanitizeUpdateMadeToOrderProfileInput,
} from '../validators/profile.sanitizer.js';
import {
  validateAddMadeToOrderProfile,
  validateUpdateMadeToOrderProfile,
} from '../validators/profile.validator.js';

@ApiBearerAuth()
@ApiTags("Profiles")
@Controller()
@UseGuards(RolesGuard)
export class MadeToOrderProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('get/made-to-order-profile-list')
  @RequireGate(GateCode.CODE_SU)
  async getMadeToOrderProfileList() {
    return this.profileService.getMadeToOrderProfileList();
  }

  @Get('get/made-to-order-profile/:profileId')
  @RequireGate(GateCode.CODE_SU)
  async getMadeToOrderProfile(@Param('profileId') profileId: string) {
    return this.profileService.getMadeToOrderProfile(Number(profileId));
  }

  @Post('add/made-to-order-profile')
  @RequireGate(GateCode.CODE_SU)
  async addMadeToOrderProfile(@Body() body: any) {
    const sanitized = sanitizeAddMadeToOrderProfileInput(body);
    const input = parseAddMadeToOrderProfileInput(sanitized);
    const error = validateAddMadeToOrderProfile(input);
    if (error) throw new BadRequestException(error);
    return this.profileService.addMadeToOrderProfile(input);
  }

  @Patch('update/made-to-order-profile')
  @RequireGate(GateCode.CODE_SU)
  async updateMadeToOrderProfile(@Body() body: any) {
    const sanitized = sanitizeUpdateMadeToOrderProfileInput(body);
    const input = parseUpdateMadeToOrderProfileInput(sanitized);
    const error = validateUpdateMadeToOrderProfile(input);
    if (error) throw new BadRequestException(error);
    return this.profileService.updateMadeToOrderProfile(input);
  }

  @Delete('delete/made-to-order-profile/:profileId')
  @RequireGate(GateCode.CODE_SU)
  async deleteMadeToOrderProfile(@Param('profileId') profileId: string) {
    return this.profileService.deleteMadeToOrderProfile(Number(profileId));
  }

  @Get('get/table-explorer/data/made-to-order-profile')
  @RequireGate(GateCode.CODE_SU)
  async exploreMadeToOrderProfile(@Query('page') page: string, @Query('size') size: string) {
    return this.profileService.exploreMadeToOrderProfile(Number(page) || 0, Number(size) || 10);
  }

  @Get('get/table-explorer/data/made-to-order-profile/:id')
  @RequireGate(GateCode.CODE_SU)
  async exploreMadeToOrderProfileById(@Param('id') id: string) {
    return this.profileService.getMadeToOrderProfile(Number(id));
  }
}
