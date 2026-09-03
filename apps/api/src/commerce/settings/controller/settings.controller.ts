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
  // PUBLIC — no @RequireGate. Loom's SettingsController.getSettingsList() calls
  // response.buildList() DIRECTLY (never getEntity/CODE_*), unlike its sibling
  // getSettings(), which does use getEntity(..., CODE_SUCU, ...). The storefront
  // fetches this during SSR with no bearer token (catalogue/loom.ts), so a gate
  // here 401s every page render.
  async getAllSettings() {
    try {
      const settings = await this.settingsService.getAllSettings();
      // Key MUST be `settingsList` — legacy Loom emits that and both the
      // storefront (components/catalogue/loom.ts) and CMS (lib/admin-api.ts)
      // read `settingsList`. `settings` rendered empty everywhere.
      return keyedResponse('settingsList', settings);
    } catch (e: any) {
      throw new HttpException(simpleResponse(false, e.message), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(RolesGuard)
    @Get('get/settings/:settingId')
    @RequireGate(GateCode.CODE_SUCU)
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
    @Get('get/table-explorer/data/settings')
    @RequireGate(GateCode.CODE_SU)
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
    @Get('get/table-explorer/data/settings/:id')
    @RequireGate(GateCode.CODE_SU)
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
