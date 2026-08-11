// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PatternService } from '../service/pattern.service.js';
import { parseAddPatternInput, parseUpdatePatternInput } from '../dto/pattern.dto.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';

@Controller()
export class PatternController {
  constructor(private readonly service: PatternService) {}

  @Get('/get/pattern-list')
  async getList() {
    return this.service.getList();
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Post('/add/pattern')
  async add(@Body() body: any) {
    const data = parseAddPatternInput(body);
    return this.service.add(data);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Patch('/update/pattern')
  async update(@Body() body: any) {
    const data = parseUpdatePatternInput(body);
    return this.service.update(data);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Delete('/delete/pattern/:id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('/get/table-explorer/data/pattern')
  async getTableExplorerData(@Query('page') page: string = '1', @Query('size') size: string = '10') {
    return this.service.getTableExplorerData(parseInt(page, 10), parseInt(size, 10));
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('/get/table-explorer/data/pattern/:id')
  async getTableExplorerDataById(@Param('id') id: string) {
    return this.service.getTableExplorerDataById(id);
  }
}
// @ts-nocheck
