export interface CreateSkillDto {
  name?: string;
  description?: string;
}

export interface UpdateSkillDto {
  id?: string;
  name?: string;
  description?: string;
}

export interface ArtisanSkillMappingFilterDto {
  page?: number;
  limit?: number;
}
