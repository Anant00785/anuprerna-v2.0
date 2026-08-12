import { CreateSkillDto, UpdateSkillDto } from '../types/skill.types.js';

export function sanitizeCreateSkill(dto: CreateSkillDto): CreateSkillDto {
  return {
    ...dto,
    name: dto.name?.trim(),
    description: dto.description?.trim(),
  };
}

export function sanitizeUpdateSkill(dto: UpdateSkillDto): UpdateSkillDto {
  return {
    ...dto,
    name: dto.name?.trim(),
    description: dto.description?.trim(),
  };
}
