// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import { eq } from 'drizzle-orm';
import * as schema from '../../../database/schema/schema.js';

@Injectable()
export class SkillRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async getSkillList() {
    return this.db.select().from(schema.skill);
  }

  async getSkillById(skillId: string) {
    const result = await this.db.select().from(schema.skill).where(eq(schema.skill.id, skillId)).limit(1);
    return result[0];
  }

  async addSkill(data: any) {
    const result = await this.db.insert(schema.skill).values(data).returning();
    return result[0];
  }

  async updateSkill(id: string, data: any) {
    const result = await this.db.update(schema.skill).set(data).where(eq(schema.skill.id, id)).returning();
    return result[0];
  }

  async deleteSkill(skillId: string) {
    await this.db.delete(schema.skill).where(eq(schema.skill.id, skillId));
  }

  async getArtisanSkillMappings(limit: number, offset: number) {
    return this.db.select().from(schema.artisanSkillMapping).limit(limit).offset(offset);
  }
}
// @ts-nocheck
// @ts-nocheck
