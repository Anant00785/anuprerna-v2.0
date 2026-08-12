import { CreateSkillDto, UpdateSkillDto } from '../types/skill.types.js';

export function validateCreateSkill(dto: CreateSkillDto): string[] {
  const errors: string[] = [];
  if (!dto.name || typeof dto.name !== 'string') errors.push('Name is required and must be a string');
  return errors;
}

export function validateUpdateSkill(dto: UpdateSkillDto): string[] {
  const errors: string[] = [];
  if (!dto.id || typeof dto.id !== 'string') errors.push('Id is required and must be a string');
  return errors;
}
