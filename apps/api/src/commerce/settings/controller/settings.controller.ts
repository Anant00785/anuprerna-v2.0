// @ts-nocheck
import { Controller, Get, Patch, Param, Body, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { SettingsService } from '../service/settings.service.js';
import { parseUpdateSettingsRequest } from '../dto/settings.dto.js';
import { validateUpdateSettingsRequest } from '../validators/settings.validator.js';
import { sanitizeUpdateSettingsRequest } from '../validators/settings.sanitizer.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';

@Controller()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('get/settings-list')
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
  async updateSettings(@Body() body: any) {
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
// @ts-nocheck
