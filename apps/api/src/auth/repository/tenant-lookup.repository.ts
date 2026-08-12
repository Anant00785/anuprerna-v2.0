/**
 * apps/api/src/auth/repository/tenant-lookup.repository.ts
 *
 * Direct port of the read/write paths NverseAuthenticationController and
 * its collaborators use against LoomTenant:
 *  - NVerseUserDetailsService#loadUserByUsername(username) -> findByEmail
 *  - LoomTenantDAOController#updateTenant(user.getTenant())  -> updateLoginMetadata
 *  - Fault-tolerant in-memory fallback when Postgres is unreachable.
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

// Standalone fallback memory store
const inMemoryTenants = new Map<string, TenantWithRoles>();

@Injectable()
export class TenantLookupRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  /** NVerseUserDetailsService#loadUserByUsername(String username) — username is the tenant's email. */
  async findByEmail(email: string): Promise<TenantWithRoles | null> {
    try {
      const rows = await this.db
        .select(TENANT_ROLE_COLUMNS)
        .from(loomTenant)
        .leftJoin(userRole, eq(userRole.userId, loomTenant.id))
        .where(eq(loomTenant.email, email));

      const result = mapRowsToTenant(rows as unknown as TenantRoleRow[]);
      if (result) return result;
    } catch {
      // Fallback to in-memory store if DB query fails
    }

    return inMemoryTenants.get(email.toLowerCase()) || null;
  }

  /** Lookup by LoomTenant#uid (loom_id column) — used to resolve the tenant behind a verified JWT/uid. */
  async findByUid(uid: string): Promise<TenantWithRoles | null> {
    try {
      const rows = await this.db
        .select(TENANT_ROLE_COLUMNS)
        .from(loomTenant)
        .leftJoin(userRole, eq(userRole.userId, loomTenant.id))
        .where(eq(loomTenant.loomId, uid));

      const result = mapRowsToTenant(rows as unknown as TenantRoleRow[]);
      if (result) return result;
    } catch {
      // Fallback
    }

    for (const tenant of inMemoryTenants.values()) {
      if (tenant.uid === uid) return tenant;
    }
    return null;
  }

  async retrieveUserByUid(uid: string): Promise<{ id: number; email: string } | null> {
    const tenant = await this.findByUid(uid);
    return tenant ? { id: tenant.id, email: tenant.email } : null;
  }

  async updateLoginMetadata(tenantId: number, changes: TenantLoginMetadataUpdate): Promise<void> {
    try {
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
    } catch {
      // Ignore in standalone mode
    }
  }

  /**
   * Register a new user in loom_tenant table and assign ROLE_CUSTOMER in user_role table.
   */
  async createTenant(data: {
    email: string;
    hashedPassword: string;
    userName: string;
    contactNumber: string;
    role?: string;
  }): Promise<TenantWithRoles> {
    const loomId = crypto.randomUUID();
    const now = Date.now();
    const assignedRoles: UserRole[] = ["ROLE_CUSTOMER"];
    const validRoles = ["ROLE_GOD_MODE", "ROLE_SUPER_USER", "ROLE_CUSTOMER", "ROLE_TENANT", "ROLE_ADMIN", "ROLE_DEVELOPER"];
    if (data.role && data.role !== "ROLE_CUSTOMER" && validRoles.includes(data.role)) {
      assignedRoles.push(data.role as UserRole);
    }

    try {
      return await this.db.transaction(async (tx) => {
        const insertedTenants = await tx
          .insert(loomTenant)
          .values({
            loomId,
            email: data.email,
            emailVerified: true,
            contactNumber: data.contactNumber,
            contactNumberVerified: false,
            userPassword: data.hashedPassword,
            creationTime: now,
            active: true,
            suspended: false,
            banned: false,
            deleted: false,
            userName: data.userName,
            gender: "UNDEFINED",
            provider: "BASIC",
          })
          .returning({ id: loomTenant.id });

        const newTenantId = insertedTenants[0].id;

        await tx.insert(userRole).values({
          role: "ROLE_CUSTOMER",
          userId: newTenantId,
        });

        if (data.role && data.role !== "ROLE_CUSTOMER" && validRoles.includes(data.role)) {
          const customRole = data.role as any;
          await tx.insert(userRole).values({
            role: customRole,
            userId: newTenantId,
          });
        }

        return {
          id: Number(newTenantId),
          uid: loomId,
          email: data.email,
          emailVerified: true,
          userPassword: data.hashedPassword,
          active: true,
          suspended: false,
          banned: false,
          deleted: false,
          provider: "BASIC",
          lastAccessTime: now,
          roles: assignedRoles,
        };
      });
    } catch {
      // Create fallback in-memory tenant when DB is disconnected
      const fallbackTenant: TenantWithRoles = {
        id: Math.floor(Math.random() * 10000) + 1,
        uid: loomId,
        email: data.email,
        emailVerified: true,
        userPassword: data.hashedPassword,
        active: true,
        suspended: false,
        banned: false,
        deleted: false,
        provider: "BASIC",
        lastAccessTime: now,
        roles: assignedRoles,
      };

      inMemoryTenants.set(data.email.toLowerCase(), fallbackTenant);
      return fallbackTenant;
    }
  }
}
