// @ts-nocheck
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { MaterialService } from '../service/material.service.js';
import { CreateMaterialDto, UpdateMaterialDto, parseAddMaterialInput, parseUpdateMaterialInput } from '../dto/material.dto.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';

@ApiTags("Material")
@ApiBearerAuth()
@Controller()
export class MaterialController {
  constructor(private readonly service: MaterialService) {}

  @Get('/get/material-list')
  @ApiOperation({ summary: "Get all materials list." })
  async getList() {
    return this.service.getList();
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Post('/add/material')
  @ApiOperation({ summary: "Add a new material (super-user)." })
  @ApiBody({ type: CreateMaterialDto })
  async add(@Body() body: any) {
    const data = parseAddMaterialInput(body);
    return this.service.add(data);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Patch('/update/material')
  @ApiOperation({ summary: "Update an existing material (super-user)." })
  @ApiBody({ type: UpdateMaterialDto })
  async update(@Body() body: any) {
    const data = parseUpdateMaterialInput(body);
    return this.service.update(data);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Delete('/delete/material/:id')
  @ApiOperation({ summary: "Delete material by ID (super-user)." })
  @ApiParam({ name: 'id', description: 'Material ID', example: 1, type: Number })
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('/get/table-explorer/data/material')
  @ApiOperation({ summary: "Paginated table-explorer projection of materials." })
  async getTableExplorerData(@Query('page') page: string = '1', @Query('size') size: string = '10') {
    return this.service.getTableExplorerData(parseInt(page, 10), parseInt(size, 10));
  }

  @UseGuards(RolesGuard)
  @RequireGate(GateCode.CODE_SU)
  @Get('/get/table-explorer/data/material/:id')
  @ApiOperation({ summary: "Table-explorer projection of material by ID." })
  @ApiParam({ name: 'id', description: 'Material ID', example: 1, type: Number })
  async getTableExplorerDataById(@Param('id') id: string) {
    return this.service.getTableExplorerDataById(id);
  }
}
