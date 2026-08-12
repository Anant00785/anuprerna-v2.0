// @ts-nocheck
import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../../../database/database.module.js';
import * as schema from '../../../database/schema/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { mapVerificationToken } from '../mapper/nverse.mapper.js';

@Injectable()
export class NVerseRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: NodePgDatabase<typeof schema>
  ) {}

  async getVerificationTokens(page: number, size: number) {
    const offset = (page - 1) * size;
    const items = await this.db.select().from(schema.verificationToken)
      .orderBy(desc(schema.verificationToken.id))
      .limit(size)
      .offset(offset);
      
    const totalResult = await this.db.select({ count: sql<number>`count(*)` }).from(schema.verificationToken);
    const total = Number(totalResult[0]?.count || 0);

    return {
      items: items.map(mapVerificationToken),
      total,
    };
  }

  async getVerificationTokenById(id: string) {
    const tokens = await this.db.select().from(schema.verificationToken).where(eq(schema.verificationToken.id, BigInt(id)));
    return mapVerificationToken(tokens[0]);
  }

  async findTenantByEmail(email: string) {
    const users = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.email, email));
    return users[0] || null;
  }

  async findTenantByContactNumber(contactNumber: string) {
    const users = await this.db.select().from(schema.loomTenant).where(eq(schema.loomTenant.contactNumber, contactNumber));
    return users[0] || null;
  }
}
// @ts-nocheck
// @ts-nocheck
