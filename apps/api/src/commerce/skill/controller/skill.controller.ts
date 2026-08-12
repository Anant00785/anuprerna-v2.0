// @ts-nocheck
import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { SkillService } from '../service/skill.service.js';
import { RolesGuard, RequireGate } from '../../../common/auth/roles.guard.js';
import { GateCode } from '../../../auth/types/auth.types.js';
import { simpleResponse, keyedResponse } from '../../../common/response/rain-response.js';
import { parseCreateSkillInput, parseUpdateSkillInput, parseArtisanSkillMappingFilterInput } from '../dto/skill.dto.js';
import { validateCreateSkill, validateUpdateSkill } from '../validators/skill.validator.js';
import { sanitizeCreateSkill, sanitizeUpdateSkill } from '../validators/skill.sanitizer.js';

@ApiBearerAuth()
@Controller()
@UseGuards(RolesGuard)
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get('get/skill-list')
  @RequireGate(GateCode.CODE_SU)
  async getSkillList() {
    const skills = await this.skillService.getSkillList();
    return keyedResponse('skills', skills);
  }

  @Get('get/skill/:skillId')
  @RequireGate(GateCode.CODE_SU)
  async getSkillById(@Param('skillId') skillId: string) {
    const skill = await this.skillService.getSkillById(skillId);
    return keyedResponse('skill', skill);
  }

  @Post('add/skill')
  @RequireGate(GateCode.CODE_SU)
  async addSkill(@Body() body: any) {
    const dto = parseCreateSkillInput(body);
    const errors = validateCreateSkill(dto);
    if (errors.length > 0) throw new BadRequestException(errors.join(', '));
    const sanitized = sanitizeCreateSkill(dto);
    const skill = await this.skillService.addSkill(sanitized);
    return simpleResponse(true, 'Skill added successfully', skill);
  }

  @Patch('update/skill')
  @RequireGate(GateCode.CODE_SU)
  async updateSkill(@Body() body: any) {
    const dto = parseUpdateSkillInput(body);
    const errors = validateUpdateSkill(dto);
    if (errors.length > 0) throw new BadRequestException(errors.join(', '));
    const sanitized = sanitizeUpdateSkill(dto);
    const { id, ...data } = sanitized;
    const skill = await this.skillService.updateSkill(id!, data);
    return simpleResponse(true, 'Skill updated successfully', skill);
  }

  @Delete('delete/skill/:skillId')
  @RequireGate(GateCode.CODE_SU)
  async deleteSkill(@Param('skillId') skillId: string) {
    await this.skillService.deleteSkill(skillId);
    return simpleResponse(true, 'Skill deleted successfully');
  }

  @Get('get/table-explorer/data/artisan-skill-mapping')
  @RequireGate(GateCode.CODE_SU)
  async getArtisanSkillMappings(@Query() query: any) {
    const filter = parseArtisanSkillMappingFilterInput(query);
    const offset = (filter.page! - 1) * filter.limit!;
    const mappings = await this.skillService.getArtisanSkillMappings(filter.limit!, offset);
    return keyedResponse('mappings', mappings);
  }
}
