/**
 * apps/api/src/auth/repository/tenant-lookup.repository.ts
 *
 * Direct port of the read/write paths NverseAuthenticationController and
 * its collaborators use against LoomTenant:
 *  - NVerseUserDetailsService#loadUserByUsername(username) -> findByEmail
 *  - LoomTenantDAOController#updateTenant(user.getTenant())  -> updateLoginMetadata
 *    (source calls this from a `new Thread(...)` after both the email and
 *    social login handlers succeed, to bump lastAccessTime/provider/password
 *    without blocking the response — mirrored here as a fire-and-forget
 *    Promise the controller does not await, not a literal spawned thread).
 *
 * Table/column names are taken directly from the introspected
 * database/schema/schema.ts (loomTenant, userRole) — the actual Postgres
 * truth — not reconstructed from the Java @Column names.
 *
 * OPTIMISTIC LOCKING: loom_tenant.version is a real bigserial NOT NULL
 * column (same BehemothORM `@Version` pattern documented at length in
 * commerce/cart/repository/cart.repository.ts). updateLoginMetadata reads
 * the current version inside a transaction, then writes
 * `WHERE id = ? AND version = ?`, mirroring Hibernate's optimistic-lock
 * UPDATE shape 1:1.
 */
import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { loomTenant, userRole } from "../../database/schema/schema.js";
import { AuthProvider, TenantLoginMetadataUpdate, TenantWithRoles, UserRole } from "../types/auth.types.js";

type TenantRoleRow = {
  id: bigint;
  version: bigint;
  uid: string;
  email: string;
  emailVerified: boolean;
  userPassword: string;
  active: boolean;
  suspended: boolean;
  banned: boolean;
  deleted: boolean;
  provider: string;
  lastAccessTime: number | null;
  role: string | null;
};

function mapRowsToTenant(rows: TenantRoleRow[]): TenantWithRoles | null {
  const first = rows[0];
  if (!first) return null;

  const roles = rows
    .map((r) => r.role)
    .filter((role): role is string => role !== null) as UserRole[];

  return {
    id: Number(first.id),
    uid: first.uid,
    email: first.email,
    emailVerified: first.emailVerified,
    userPassword: first.userPassword,
    active: first.active,
    suspended: first.suspended,
    banned: first.banned,
    deleted: first.deleted,
    provider: first.provider as AuthProvider,
    lastAccessTime: first.lastAccessTime,
    roles,
  };
}

const TENANT_ROLE_COLUMNS = {
  id: loomTenant.id,
  version: loomTenant.version,
  uid: loomTenant.loomId,
  email: loomTenant.email,
  emailVerified: loomTenant.emailVerified,
  userPassword: loomTenant.userPassword,
  active: loomTenant.active,
  suspended: loomTenant.suspended,
  banned: loomTenant.banned,
  deleted: loomTenant.deleted,
  provider: loomTenant.provider,
  lastAccessTime: loomTenant.lastAccessTime,
  role: userRole.role,
} as const;

@Injectable()
export class TenantLookupRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** NVerseUserDetailsService#loadUserByUsername(String username) — username is the tenant's email. */
  async findByEmail(email: string): Promise<TenantWithRoles | null> {
    const rows = await this.db
      .select(TENANT_ROLE_COLUMNS)
      .from(loomTenant)
      .leftJoin(userRole, eq(userRole.userId, loomTenant.id))
      .where(eq(loomTenant.email, email));

    return mapRowsToTenant(rows as unknown as TenantRoleRow[]);
  }

  /** Lookup by LoomTenant#uid (loom_id column) — used to resolve the tenant behind a verified JWT/uid. */
  async findByUid(uid: string): Promise<TenantWithRoles | null> {
    const rows = await this.db
      .select(TENANT_ROLE_COLUMNS)
      .from(loomTenant)
      .leftJoin(userRole, eq(userRole.userId, loomTenant.id))
      .where(eq(loomTenant.loomId, uid));

    return mapRowsToTenant(rows as unknown as TenantRoleRow[]);
  }

  /**
   * Narrow projection matching Cart's `TenantLookupPort#retrieveUserByUid`
   * contract (commerce/cart/types/cart.types.ts) exactly, so this
   * repository can be bound directly in place of Cart's dummy
   * TENANT_LOOKUP_PORT once Auth is wired into other feature modules — no
   * adapter needed.
   */
  async retrieveUserByUid(uid: string): Promise<{ id: number; email: string } | null> {
    const tenant = await this.findByUid(uid);
    return tenant ? { id: tenant.id, email: tenant.email } : null;
  }

  /**
   * LoomTenantDAOController#updateTenant equivalent, scoped to the fields
   * the login flow actually mutates post-authentication:
   *  - email login: lastAccessTime, provider = BASIC
   *  - social login: emailVerified = true, lastAccessTime, provider, password (re-hashed)
   * Silently no-ops if the tenant no longer exists (source's updateTenant
   * has no such guard, but it runs inside a bare Thread with no error
   * handling either — a missing row here is equally inert).
   */
  async updateLoginMetadata(tenantId: number, changes: TenantLoginMetadataUpdate): Promise<void> {
    await this.db.transaction(async (tx) => {
      const rows = await tx
        .select({ version: loomTenant.version })
        .from(loomTenant)
        .where(eq(loomTenant.id, BigInt(tenantId)));

      const existing = rows[0];
      if (!existing) return;

      await tx
        .update(loomTenant)
        .set({ ...changes, version: existing.version + 1n })
        .where(and(eq(loomTenant.id, BigInt(tenantId)), eq(loomTenant.version, existing.version)));
    });
  }
}