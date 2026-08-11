// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq } from 'drizzle-orm';

@Injectable()
export class MaterialRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll() {
    return this.db.select().from(schema.material);
  }

  async findById(id: bigint) {
    const result = await this.db.select().from(schema.material).where(eq(schema.material.id, id));
    return result[0];
  }

  async create(data: any) {
    const result = await this.db.insert(schema.material).values({
      ...data,
      timeOfCreation: Date.now(),
    }).returning();
    return result[0];
  }

  async update(id: bigint, data: any) {
    const result = await this.db.update(schema.material)
      .set(data)
      .where(eq(schema.material.id, id))
      .returning();
    return result[0];
  }

  async delete(id: bigint) {
    await this.db.delete(schema.material).where(eq(schema.material.id, id));
  }

  async getPaginated(page: number, size: number) {
    const limit = size;
    const offset = (page - 1) * size;
    return this.db.select().from(schema.material).limit(limit).offset(offset);
  }
}
// @ts-nocheck
// @ts-nocheck
