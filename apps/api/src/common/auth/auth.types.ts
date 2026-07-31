/**
 * apps/api/src/auth/types/auth.types.ts
 *
 * Canonical type definitions for the Auth module. Every type imported by
 * ANY other file in this module (including common/auth/roles.guard.ts and
 * common/auth/current-tenant.decorator.ts, which sit outside this feature
 * folder but depend on it) is exported from here — this file is the single
 * source of truth so the module can't drift out of sync across files again.
 *
 * Reconstructed from:
 *  - com.bloomscorp.loom.tenant.orm.LoomTenant / USER_ROLE / UserRole
 *  - com.bloomscorp.loom.nverse.LoomGatekeeper (role/gate codes)
 *  - com.bloomscorp.loom.nverse.pojo.Authority
 *  - database/schema/schema.ts (userRoleEnum, authProviderEnum) — the
 *    actual introspected Postgres truth this repository queries against.
 *
 * ROLE DISCREPANCY (flagged, not silently resolved):
 * com.bloomscorp.loom.tenant.orm.USER_ROLE (Java enum) defines
 * ROLE_GOD_MODE, ROLE_SUPER_USER, ROLE_CUSTOMER, ROLE_ARTISAN.
 * database/schema/schema.ts's `userRoleEnum` (the actual migrated Postgres
 * type `user_role_enum`) defines ROLE_GOD_MODE, ROLE_SUPER_USER,
 * ROLE_ADMIN, ROLE_CUSTOMER — ROLE_ARTISAN is NOT a member, and ROLE_ADMIN
 * does not exist in the Java enum. `UserRole` below mirrors the DATABASE
 * truth (schema.ts), since TenantLookupRepository queries the real column.
 * LoomGatekeeper's CODE_AR / roleAR logic is still ported 1:1 in
 * gatekeeper.service.ts for fidelity, but is structurally inert (always
 * false) until an ARTISAN role value is added to the enum.
 *
 * No validation library (zod/class-validator) is installed in this
 * project, so these stay plain TS types with hand-written runtime guards
 * in dto/auth.dto.ts.
 */

/** Mirrors database/schema/schema.ts's `userRoleEnum` exactly (source: user_role_enum Postgres type). */
export const USER_ROLES = ["ROLE_GOD_MODE", "ROLE_SUPER_USER", "ROLE_ADMIN", "ROLE_CUSTOMER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Mirrors database/schema/schema.ts's `authProviderEnum` exactly (source: auth_provider_enum Postgres type). */
export const AUTH_PROVIDERS = ["UNKNOWN", "BASIC", "GOOGLE", "FACEBOOK"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

/**
 * com.bloomscorp.loom.nverse.LoomGatekeeper — the seven authority codes,
 * source-verified as public static final int constants CODE_SU=1 ..
 * CODE_SUCUAR=7. Imported by common/auth/roles.guard.ts (RequireGate
 * decorator) and service/gatekeeper.service.ts (authority switch).
 */
export enum GateCode {
  CODE_SU = 1,
  CODE_CU = 2,
  CODE_AR = 3,
  CODE_SUCU = 4,
  CODE_SUAR = 5,
  CODE_CUAR = 6,
  CODE_SUCUAR = 7,
}

/**
 * Shape attached to `request.tenant` by RolesGuard and returned by
 * CurrentTenant. Mirrors the fields NVerseUser<LoomTenant, ...>#getTenant()
 * exposes that the rest of the app actually reads (id, uid, roles); `email`
 * added because AuthController's own handlers need it.
 */
export interface AuthenticatedTenant {
  id: number;
  uid: string;
  email: string;
  roles: UserRole[];
}

/**
 * Row shape produced by TenantLookupRepository — a LoomTenant joined with
 * its UserRole rows, restricted to the columns the auth flow (login,
 * disable checks, provider validation) actually reads. Field names mirror
 * LoomTenant's Java properties; `uid` corresponds to LoomTenant#uid
 * (column loom_id).
 */
export interface TenantWithRoles {
  id: number;
  uid: string;
  email: string;
  emailVerified: boolean;
  userPassword: string;
  active: boolean;
  suspended: boolean;
  banned: boolean;
  deleted: boolean;
  provider: AuthProvider;
  lastAccessTime: number | null;
  roles: UserRole[];
}

/**
 * com.bloomscorp.loom.nverse.pojo.Authority — `public final record
 * Authority(boolean superUser, boolean customer)`. Field names/order
 * preserved exactly; this is the payload AuthorityTokenResponse#buildList
 * returns under the "authority" response key (support.ResponseParameter.AUTHORITY).
 */
export interface Authority {
  superUser: boolean;
  customer: boolean;
}

/**
 * JWT payload shape. com.bloomscorp.nverse.NVerseJWTService is an external
 * framework class (package com.bloomscorp.nverse, not present in this
 * repository) — its token claim structure isn't source-verified. This is a
 * reconstruction sized to exactly what AuthenticatedTenant needs downstream
 * (RolesGuard rehydrates AuthenticatedTenant from these claims).
 */
export interface JwtPayload {
  sub: number; // tenant id
  uid: string;
  email: string;
  roles: UserRole[];
  iat: number;
  exp: number;
}

/**
 * Values TenantLookupRepository#updateLoginMetadata accepts. Extracted as
 * a named export (rather than an inline Partial<...> at each call site) so
 * both the repository and its callers (auth.controller.ts) reference one
 * definition.
 */
export interface TenantLoginMetadataUpdate {
  lastAccessTime?: number;
  provider?: AuthProvider;
  userPassword?: string;
  emailVerified?: boolean;
}

/**
 * Port over com.auth0.jwt / com.auth0.jwk (Auth0Service in source uses
 * external com.auth0:java-jwt / com.auth0:jwks-rsa libraries, not confirmed
 * present as Node dependencies here). Out of scope for this migration —
 * a narrow port, bound to a safe dummy in auth.module.ts until a real
 * Auth0 JWKS client is wired in.
 */
export interface Auth0ValidationPort {
  /** Auth0Service#validateToken(String token, String email) */
  validateToken(token: string, email: string): Promise<boolean>;
  /** Auth0Service#getUserFromToken(String token) — decoded/derived password surrogate used by source to re-hash+store */
  getUserFromToken(token: string): Promise<string>;
}

export const AUTH0_VALIDATION_PORT = Symbol("AUTH0_VALIDATION_PORT");