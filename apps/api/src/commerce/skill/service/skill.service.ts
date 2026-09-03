import { Injectable } from '@nestjs/common';
import { SkillRepository } from '../repository/skill.repository.js';
import { mapSkill, mapArtisanSkillMapping } from '../mapper/skill.mapper.js';

@Injectable()
export class SkillService {
  constructor(private readonly skillRepo: SkillRepository) {}

  async getSkillList() {
    const skills = await this.skillRepo.getSkillList();
    return skills.map(mapSkill);
  }

  async getSkillById(skillId: string) {
    const skill = await this.skillRepo.getSkillById(skillId);
    return skill ? mapSkill(skill) : null;
  }

  async addSkill(data: any) {
    const skill = await this.skillRepo.addSkill(data);
    return skill ? mapSkill(skill) : null;
  }

  async updateSkill(id: string, data: any) {
    const skill = await this.skillRepo.updateSkill(id, data);
    return skill ? mapSkill(skill) : null;
  }

  async deleteSkill(skillId: string) {
    await this.skillRepo.deleteSkill(skillId);
  }

  async getArtisanSkillMappings(limit: number, offset: number) {
    const mappings = await this.skillRepo.getArtisanSkillMappings(limit, offset);
    return mappings.map(mapArtisanSkillMapping);
  }
}
