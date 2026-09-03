import { CreateSkillDto, UpdateSkillDto, ArtisanSkillMappingFilterDto } from '../types/skill.types.js';

export function parseCreateSkillInput(data: any): CreateSkillDto {
  return {
    name: data?.name,
    description: data?.description,
  };
}

export function parseUpdateSkillInput(data: any): UpdateSkillDto {
  return {
    id: data?.id,
    name: data?.name,
    description: data?.description,
  };
}

export function parseArtisanSkillMappingFilterInput(query: any): ArtisanSkillMappingFilterDto {
  return {
    page: query?.page ? parseInt(query.page, 10) : 1,
    limit: query?.limit ? parseInt(query.limit, 10) : 10,
  };
}
