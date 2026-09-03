import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import { eq } from 'drizzle-orm';
import * as schema from '../../../database/schema/schema.js';

/** skill.id is a bigserial; route params arrive as strings. */
function toSkillId(value: string): bigint | null {
  return /^\d+$/.test(value.trim()) ? BigInt(value.trim()) : null;
}

@Injectable()
export class SkillRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async getSkillList() {
    return this.db.select().from(schema.skill);
  }

  async getSkillById(skillId: string) {
    const id = toSkillId(skillId);
    if (id === null) return undefined;
    const result = await this.db.select().from(schema.skill).where(eq(schema.skill.id, id)).limit(1);
    return result[0];
  }

  async addSkill(data: any) {
    const result = await this.db.insert(schema.skill).values(data).returning();
    return result[0];
  }

  async updateSkill(id: string, data: any) {
    const skillId = toSkillId(id);
    if (skillId === null) return undefined;
    const result = await this.db.update(schema.skill).set(data).where(eq(schema.skill.id, skillId)).returning();
    return result[0];
  }

  async deleteSkill(skillId: string) {
    const id = toSkillId(skillId);
    if (id === null) return;
    await this.db.delete(schema.skill).where(eq(schema.skill.id, id));
  }

  async getArtisanSkillMappings(limit: number, offset: number) {
    return this.db.select().from(schema.artisanSkillMapping).limit(limit).offset(offset);
  }
}
