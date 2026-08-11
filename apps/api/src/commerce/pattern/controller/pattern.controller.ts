// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PatternService } from '../service/pattern.service.js';
import { CreatePatternDto, UpdatePatternDto, parseAddPatternInput, parseUpdatePatternInput } from '../dto/pattern.dto.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';

@ApiTags("Pattern")
@ApiBearerAuth()
@Controller()
export class PatternController {
  constructor(private readonly service: PatternService) {}

  @Get('/get/pattern-list')
  @ApiOperation({ summary: "Get all patterns list." })
  async getList() {
    return this.service.getList();
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Post('/add/pattern')
  @ApiOperation({ summary: "Add a new pattern (super-user)." })
  @ApiBody({ type: CreatePatternDto })
  async add(@Body() body: any) {
    const data = parseAddPatternInput(body);
    return this.service.add(data);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Patch('/update/pattern')
  @ApiOperation({ summary: "Update an existing pattern (super-user)." })
  @ApiBody({ type: UpdatePatternDto })
  async update(@Body() body: any) {
    const data = parseUpdatePatternInput(body);
    return this.service.update(data);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Delete('/delete/pattern/:id')
  @ApiOperation({ summary: "Delete pattern by ID (super-user)." })
  @ApiParam({ name: 'id', description: 'Pattern ID', example: 1, type: Number })
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('/get/table-explorer/data/pattern')
  @ApiOperation({ summary: "Paginated table-explorer projection of patterns." })
  async getTableExplorerData(@Query('page') page: string = '1', @Query('size') size: string = '10') {
    return this.service.getTableExplorerData(parseInt(page, 10), parseInt(size, 10));
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('/get/table-explorer/data/pattern/:id')
  @ApiOperation({ summary: "Table-explorer projection of pattern by ID." })
  @ApiParam({ name: 'id', description: 'Pattern ID', example: 1, type: Number })
  async getTableExplorerDataById(@Param('id') id: string) {
    return this.service.getTableExplorerDataById(id);
  }
}
