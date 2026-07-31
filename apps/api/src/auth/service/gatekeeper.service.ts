/**
 * apps/api/src/auth/service/gatekeeper.service.ts
 *
 * Direct port of com.bloomscorp.loom.nverse.LoomGatekeeper's authority
 * logic (userHasAppropriateAuthority + the roleroleGOD/roleSU/roleCU/
 * roleAR predicates), consolidated with the responsibilities of two
 * external NVerse framework services that have no source in this
 * repository — com.bloomscorp.nverse.NVerseJWTService (token issuance/
 * verification) and the password-hashing side of Spring's PasswordEncoder
 * bean — so the Auth module is runnable end to end. Each reconstructed
 * piece is flagged inline; the role-authority switch itself is ported 1:1.
 *
 * Every method common/auth/roles.guard.ts calls on this service —
 * `verifyToken` and `userHasAppropriateAuthority` — is defined below.
 *
 * PASSWORD HASHING: Spring's concrete PasswordEncoder bean isn't defined
 * in any uploaded source file. Reconstructed using Node's built-in scrypt
 * (no external dependency assumed).
 *
 * JWT: com.bloomscorp.nverse.NVerseJWTService is external and not present
 * in this repository. Reconstructed as a minimal HMAC-SHA256 JWT (header,
 * payload, signature — base64url, `node:crypto` only). TTL (24h) is NOT
 * source-verified; it's a reasonable default, override via
 * AUTH_JWT_TTL_SECONDS.
 */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { AuthenticatedTenant, GateCode, JwtPayload, UserRole } from "../types/auth.types.js";

const scrypt = promisify(scryptCb);

const JWT_SECRET = process.env.AUTH_JWT_SECRET!;
const TOKEN_TTL_SECONDS = Number(process.env.AUTH_JWT_TTL_SECONDS ?? 24 * 60 * 60);

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

@Injectable()
export class GatekeeperService {
  // ---------------------------------------------------------------------
  // Password hashing (PasswordEncoder reconstruction — see file header)
  // ---------------------------------------------------------------------

  async hashPassword(plainText: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = (await scrypt(plainText, salt, 64)) as Buffer;
    return `${salt.toString("hex")}:${derived.toString("hex")}`;
  }

  async verifyPassword(plainText: string, stored: string): Promise<boolean> {
    const [saltHex, hashHex] = stored.split(":");
    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = (await scrypt(plainText, salt, 64)) as Buffer;

    return derived.length === expected.length && timingSafeEqual(derived, expected);
  }

  // ---------------------------------------------------------------------
  // JWT issuance/verification (NVerseJWTService reconstruction — see file header)
  // ---------------------------------------------------------------------

  /** NVerseJWTService#generateToken(NVerseUser) equivalent. */
  generateToken(tenant: AuthenticatedTenant): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      sub: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
    };

    const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = base64url(JSON.stringify(payload));
    const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");

    return `${header}.${body}.${signature}`;
  }

  /**
   * NVerseAuthorityResolver#resolveUserInformationFromAuthorizationToken
   * equivalent — verifies signature + expiry, returns the rehydrated
   * AuthenticatedTenant. Throws UnauthorizedException on any failure
   * (bad signature, malformed token, expired) rather than returning null,
   * matching source's exception-based control flow. Called directly by
   * RolesGuard.
   */
  verifyToken(token: string): AuthenticatedTenant {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new UnauthorizedException("Malformed token.");
    }
    const [header, body, signature] = parts;

    const expectedSignature = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException("Invalid token signature.");
    }

    let payload: JwtPayload;
    try {
      payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    } catch {
      throw new UnauthorizedException("Malformed token payload.");
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Token has expired.");
    }

    return { id: payload.sub, uid: payload.uid, email: payload.email, roles: payload.roles };
  }

  // ---------------------------------------------------------------------
  // Role authority — direct port of LoomGatekeeper (source-verified 1:1)
  // ---------------------------------------------------------------------

  private hasRole(user: AuthenticatedTenant, role: UserRole): boolean {
    return user.roles.includes(role);
  }

  /**
   * roleGOD is inherited from com.bloomscorp.nverse.NVerseGatekeeper
   * (external, no source in this repository). Every LoomGatekeeper role
   * method calls `this.roleGOD(user) || ...` first, so its contract is
   * unambiguous from usage even without the base class: god-mode users
   * satisfy every gate. Reconstructed on that basis.
   */
  private roleGOD(user: AuthenticatedTenant): boolean {
    return this.hasRole(user, "ROLE_GOD_MODE");
  }

  /**
   * roleSU is also inherited from NVerseGatekeeper (external, not in
   * source) but is called directly from the CODE_SU switch case exactly
   * like the other role*() methods LoomGatekeeper itself defines — same
   * `roleGOD || specific role` shape, reconstructed by symmetry.
   */
  private roleSU(user: AuthenticatedTenant): boolean {
    return this.roleGOD(user) || this.hasRole(user, "ROLE_SUPER_USER");
  }

  /** LoomGatekeeper#roleCU — source-verified. */
  private roleCU(user: AuthenticatedTenant): boolean {
    return this.roleGOD(user) || this.hasRole(user, "ROLE_CUSTOMER");
  }

  /**
   * LoomGatekeeper#roleAR — source-verified in shape, checking
   * USER_ROLE.ROLE_ARTISAN. ROLE_ARTISAN is NOT a member of the migrated
   * `user_role_enum` (see auth.types.ts's ROLE DISCREPANCY note), so the
   * `includes` check can never be true against real data today — ported
   * 1:1 rather than removed, so it activates automatically once/if
   * ROLE_ARTISAN is added to the enum.
   */
  private roleAR(user: AuthenticatedTenant): boolean {
    return this.roleGOD(user) || (user.roles as string[]).includes("ROLE_ARTISAN");
  }

  /** LoomGatekeeper#roleSUCU — source-verified. */
  private roleSUCU(user: AuthenticatedTenant): boolean {
    return this.roleGOD(user) || this.roleSU(user) || this.roleCU(user);
  }

  /** LoomGatekeeper#roleSUAR — source-verified. */
  private roleSUAR(user: AuthenticatedTenant): boolean {
    return this.roleGOD(user) || this.roleSU(user) || this.roleAR(user);
  }

  /** LoomGatekeeper#roleCUAR — source-verified. */
  private roleCUAR(user: AuthenticatedTenant): boolean {
    return this.roleGOD(user) || this.roleCU(user) || this.roleAR(user);
  }

  /** LoomGatekeeper#roleSUCUAR — source-verified. */
  private roleSUCUAR(user: AuthenticatedTenant): boolean {
    return this.roleGOD(user) || this.roleSU(user) || this.roleCU(user) || this.roleAR(user);
  }

  /**
   * LoomGatekeeper#userHasAppropriateAuthority(LoomTenant, int) —
   * source-verified 1:1 switch. Called directly by RolesGuard.
   */
  userHasAppropriateAuthority(user: AuthenticatedTenant, code: GateCode): boolean {
    switch (code) {
      case GateCode.CODE_SU:
        return this.roleSU(user);
      case GateCode.CODE_CU:
        return this.roleCU(user);
      case GateCode.CODE_AR:
        return this.roleAR(user);
      case GateCode.CODE_SUCU:
        return this.roleSUCU(user);
      case GateCode.CODE_SUAR:
        return this.roleSUAR(user);
      case GateCode.CODE_CUAR:
        return this.roleCUAR(user);
      case GateCode.CODE_SUCUAR:
        return this.roleSUCUAR(user);
      default:
        return false;
    }
  }
}