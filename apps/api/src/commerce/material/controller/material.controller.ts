// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MaterialService } from '../service/material.service.js';
import { parseAddMaterialInput, parseUpdateMaterialInput } from '../dto/material.dto.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';

@Controller()
export class MaterialController {
  constructor(private readonly service: MaterialService) {}

  @Get('/get/material-list')
  async getList() {
    return this.service.getList();
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Post('/add/material')
  async add(@Body() body: any) {
    const data = parseAddMaterialInput(body);
    return this.service.add(data);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Patch('/update/material')
  async update(@Body() body: any) {
    const data = parseUpdateMaterialInput(body);
    return this.service.update(data);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Delete('/delete/material/:id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('/get/table-explorer/data/material')
  async getTableExplorerData(@Query('page') page: string = '1', @Query('size') size: string = '10') {
    return this.service.getTableExplorerData(parseInt(page, 10), parseInt(size, 10));
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('/get/table-explorer/data/material/:id')
  async getTableExplorerDataById(@Param('id') id: string) {
    return this.service.getTableExplorerDataById(id);
  }
}
// @ts-nocheck
