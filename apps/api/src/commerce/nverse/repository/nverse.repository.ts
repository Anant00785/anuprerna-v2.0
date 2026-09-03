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

  /**
   * Single-use email verification. Replaces NVerseService#verifyEmail's
   * previous unconditional `success` — the token must exist, belong to the
   * tenant behind that email, be unexpired and unconsumed. Marks the token
   * consumed and the tenant verified in one transaction, so a replayed token
   * fails on the second call.
   *
   * `expires_at` / `verified_at` are varchar in the introspected schema (epoch
   * millis as text, matching created_at) — parsed defensively; an unparseable
   * expiry is treated as expired.
   */
  async consumeEmailVerificationToken(email: string, token: string): Promise<boolean> {
    if (!email || !token) return false;

    const rows = await this.db
      .select({
        id: schema.verificationToken.id,
        expiresAt: schema.verificationToken.expiresAt,
        verifiedAt: schema.verificationToken.verifiedAt,
        tenantId: schema.verificationToken.tenantId,
      })
      .from(schema.verificationToken)
      .innerJoin(schema.loomTenant, eq(schema.loomTenant.id, sql`${schema.verificationToken.tenantId}`))
      .where(sql`${schema.verificationToken.token} = ${token} and lower(${schema.loomTenant.email}) = ${email.trim().toLowerCase()}`);

    const row = rows[0];
    if (!row || row.verifiedAt) return false;

    const expiry = Number(row.expiresAt);
    if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

    const now = String(Date.now());
    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.verificationToken)
        .set({ verifiedAt: now })
        .where(eq(schema.verificationToken.id, row.id));
      await tx
        .update(schema.loomTenant)
        .set({ emailVerified: true })
        .where(eq(schema.loomTenant.id, BigInt(row.tenantId)));
    });

    return true;
  }
}
