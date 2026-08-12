// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq } from 'drizzle-orm';
import { SettingsDTO } from '../types/settings.types.js';
import { mapSettingsRowToDTO, mapSettingsRowListToDTOList } from '../mapper/settings.mapper.js';

@Injectable()
export class SettingsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: any) {}

  async findAll(): Promise<SettingsDTO[]> {
    const rows = await this.db.select().from(schema.settings);
    return mapSettingsRowListToDTOList(rows);
  }

  async findById(id: bigint): Promise<SettingsDTO | null> {
    const rows = await this.db.select().from(schema.settings).where(eq(schema.settings.id, id));
    if (rows.length === 0) return null;
    return mapSettingsRowToDTO(rows[0]);
  }

  async updateSettings(id: bigint, attributeValue: any, attributeLink: string): Promise<SettingsDTO> {
    const rows = await this.db.update(schema.settings)
      .set({ attributeValue, attributeLink })
      .where(eq(schema.settings.id, id))
      .returning();
    return mapSettingsRowToDTO(rows[0]);
  }

  async getPaginatedSettings(page: number, size: number): Promise<SettingsDTO[]> {
    const limit = size;
    const offset = page * size;
    const rows = await this.db.select().from(schema.settings).limit(limit).offset(offset);
    return mapSettingsRowListToDTOList(rows);
  }
}
// @ts-nocheck
// @ts-nocheck
