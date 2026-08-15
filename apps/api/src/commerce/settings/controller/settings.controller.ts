// @ts-nocheck
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Controller, Get, Patch, Param, Body, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { SettingsService } from '../service/settings.service.js';
import { UpdateSettingsDto, parseUpdateSettingsRequest } from '../dto/settings.dto.js';
import { validateUpdateSettingsRequest } from '../validators/settings.validator.js';
import { sanitizeUpdateSettingsRequest } from '../validators/settings.sanitizer.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';

@ApiBearerAuth()
@ApiTags("Settings")
@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('get/settings-list')
  @ApiOperation({ summary: "Get all global application settings." })
  @ApiResponse({ status: 200, description: "List of settings." })
  async getAllSettings() {
    try {
      const settings = await this.settingsService.getAllSettings();
      return keyedResponse('settings', settings);
    } catch (e: any) {
      throw new HttpException(simpleResponse(false, e.message), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SUCU)
  @Get('get/settings/:settingId')
  @ApiOperation({ summary: "Get setting by setting ID." })
  @ApiParam({ name: "settingId", type: Number, description: "Setting unique identifier", example: 1 })
  @ApiResponse({ status: 200, description: "Setting details." })
  async getSettingById(@Param('settingId') settingId: string) {
    try {
      const id = BigInt(settingId);
      const setting = await this.settingsService.getSettingById(id);
      if (!setting) {
          return simpleResponse(false, 'Setting not found');
      }
      return keyedResponse('setting', setting);
    } catch (e: any) {
      throw new HttpException(simpleResponse(false, e.message), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Patch('update/settings')
  @ApiOperation({ summary: "Update application setting by ID." })
  @ApiBody({ type: UpdateSettingsDto })
  @ApiResponse({ status: 200, description: "Updated setting details." })
  async updateSettings(@Body() body: UpdateSettingsDto) {
    try {
      let request = parseUpdateSettingsRequest(body);
      request = sanitizeUpdateSettingsRequest(request);
      
      const error = validateUpdateSettingsRequest(request);
      if (error) {
          return simpleResponse(false, error);
      }

      const updated = await this.settingsService.updateSettings(request);
      return keyedResponse('setting', updated);
    } catch (e: any) {
      throw new HttpException(simpleResponse(false, e.message), HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('get/table-explorer/data/settings')
  @ApiOperation({ summary: "Get paginated settings data for Table Explorer." })
  @ApiQuery({ name: "page", required: false, type: Number, example: 0, description: "Page number (0-indexed)" })
  @ApiQuery({ name: "size", required: false, type: Number, example: 10, description: "Page size" })
  @ApiResponse({ status: 200, description: "Paginated list of settings." })
  async getPaginatedSettings(@Query('page') page: string = '0', @Query('size') size: string = '10') {
    try {
      const p = parseInt(page, 10);
      const s = parseInt(size, 10);
      const settings = await this.settingsService.getPaginatedSettings(p, s);
      return keyedResponse('settings', settings);
    } catch (e: any) {
      throw new HttpException(simpleResponse(false, e.message), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('get/table-explorer/data/settings/:id')
  @ApiOperation({ summary: "Get setting data by ID for Table Explorer." })
  @ApiParam({ name: "id", type: Number, description: "Setting unique identifier", example: 1 })
  @ApiResponse({ status: 200, description: "Setting explorer details." })
  async getSettingExplorerById(@Param('id') idParam: string) {
    try {
      const id = BigInt(idParam);
      const setting = await this.settingsService.getSettingById(id);
      if (!setting) {
          return simpleResponse(false, 'Setting not found');
      }
      return keyedResponse('setting', setting);
    } catch (e: any) {
      throw new HttpException(simpleResponse(false, e.message), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
