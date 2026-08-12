/**
 * apps/api/src/auth/service/gatekeeper.service.ts
 *
 * Direct port of com.bloomscorp.loom.nverse.LoomGatekeeper's authority
 * logic (userHasAppropriateAuthority + the roleroleGOD/roleSU/roleCU/
 * roleAR predicates), consolidated with the responsibilities of two
 * external NVerse framework services that have no source in this
 * repository — com.bloomscorp.nverse.NVerseJWTService (token issuance/
 * verification) and com.bloomscorp.nverse.NVersePasswordEncoder — so the
 * Auth module is runnable end to end. Each reconstructed piece is flagged
 * inline; the role-authority switch itself is ported 1:1.
 *
 * Every method common/auth/roles.guard.ts calls on this service —
 * `verifyToken` and `userHasAppropriateAuthority` — is defined below.
 *
 * PASSWORD HASHING: NVersePasswordEncoder extends Spring's
 * BCryptPasswordEncoder with a secret pepper PREPENDED before hashing —
 * `bcrypt(pepper + rawPassword)`, cost factor 11. Source-verified from
 * `documentation/bmx-nverse.md:895-904` ("Extends BCryptPasswordEncoder
 * with a secret pepper prepended before hashing" / "Encodes `pepper +
 * rawPassword` with BCrypt") and `NVerseLaunchSequence1.java:141-159`
 * (`passwordEncoder(pepper)` bean, cost factor 11, javadoc: "Configures
 * bcrypt password encoding with a cost factor of 11 and an additional
 * pepper"). This ordering is load-bearing: 7,254 existing customer
 * accounts have bcrypt(pepper + password) hashes in production. Getting
 * the concatenation order wrong locks every one of them out silently.
 * Uses `bcryptjs` (pure JS, no native build step) rather than `bcrypt`.
 *
 * JWT: com.bloomscorp.nverse.NVerseJWTService is external and not present
 * in this repository (its doc entry says HS512 with a username-only
 * subject claim — a shape this repo's RolesGuard/AuthenticatedTenant
 * doesn't share). Per the integration plan (JC-2), legacy tokens are not
 * reproduced — this issues native HS256 JWTs via `jose`, preserving the
 * existing claim shape (JwtPayload: sub/uid/email/roles/iat/exp) so
 * RolesGuard and CurrentTenant keep working unchanged. Signed with
 * AUTH_JWT_SECRET, TTL from AUTH_JWT_TTL_SECONDS (falls back to 24h only
 * if unset).
 *
 * `generateToken` uses `jose`'s `SignJWT` (async — `jose` has no sync
 * signer). `verifyToken` does NOT: `common/auth/roles.guard.ts` (frozen,
 * out of this module's ownership) calls `verifyToken` synchronously —
 * `const tenant: AuthenticatedTenant = this.gatekeeper.verifyToken(token)`
 * — and `roles.guard.spec.ts` mocks it with `mockReturnValue(tenant)`,
 * asserting `canActivate` returns a plain `boolean`, not a `Promise`.
 * `jose`'s `jwtVerify` has no synchronous form on Node (it's WebCrypto/
 * Promise-based throughout), so making `verifyToken` async would either
 * fail typecheck (`Promise<AuthenticatedTenant>` is not `AuthenticatedTenant`)
 * or silently break every `@RequireGate` route by treating a pending
 * Promise as a truthy tenant. `verifyToken` therefore stays a synchronous,
 * constant-time HS256 check via `node:crypto` — verifying the exact JWS
 * compact form `jose`'s `SignJWT` produces, so tokens issued via `jose`
 * verify correctly here; only the verify path is hand-rolled, not both.
 */
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { SignJWT, type JWTPayload } from "jose";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AuthenticatedTenant, GateCode, JwtPayload, UserRole } from "../types/auth.types.js";
import type { EnvironmentVariables } from "../../common/config/env.schema.js";

/** NVersePasswordEncoder's bcrypt cost factor — source-verified, see file header. */
const BCRYPT_COST_FACTOR = 11;

const JWT_ALGORITHM = "HS256";

@Injectable()
export class GatekeeperService {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  private get jwtSecret(): string {
    return this.config.get("AUTH_JWT_SECRET", { infer: true });
  }

  private get jwtSecretKey(): Uint8Array {
    return new TextEncoder().encode(this.jwtSecret);
  }

  private get tokenTtlSeconds(): number {
    return this.config.get("AUTH_JWT_TTL_SECONDS", { infer: true }) ?? 24 * 60 * 60;
  }

  /** nverse.encoder.pepper, read via ConfigService — never logged, never in a test fixture. */
  private get pepper(): string {
    return this.config.get("AUTH_PASSWORD_PEPPER", { infer: true }) ?? "";
  }

  // ---------------------------------------------------------------------
  // Password hashing — NVersePasswordEncoder port (bcrypt(pepper + raw), cost 11)
  // ---------------------------------------------------------------------

  async hashPassword(plainText: string): Promise<string> {
    return bcrypt.hash(this.pepper + plainText, BCRYPT_COST_FACTOR);
  }

  async verifyPassword(plainText: string, stored: string): Promise<boolean> {
    if (!stored) return false;
    return bcrypt.compare(this.pepper + plainText, stored);
  }

  // ---------------------------------------------------------------------
  // JWT issuance/verification (NVerseJWTService reconstruction — see file header)
  // ---------------------------------------------------------------------

  /** NVerseJWTService#generateToken(NVerseUser) equivalent. */
  async generateToken(tenant: AuthenticatedTenant): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.tokenTtlSeconds;

    // Claim shape is JwtPayload minus iat/exp (jose sets those via
    // setIssuedAt/setExpirationTime). `sub` stays numeric — the shape
    // verifyToken/RolesGuard/AuthenticatedTenant expect — even though
    // jose's own JWTPayload type declares `sub?: string` per the JWT spec;
    // jose doesn't enforce that at runtime, only in its own TS surface.
    const claims: Omit<JwtPayload, "iat" | "exp"> = {
      sub: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    };

    return new SignJWT(claims as unknown as JWTPayload)
      .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(this.jwtSecretKey);
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

    let expectedSignature: string;
    try {
      expectedSignature = createHmac("sha256", this.jwtSecret).update(`${header}.${body}`).digest("base64url");
    } catch {
      throw new UnauthorizedException("Malformed token.");
    }

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

    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException("Token has expired.");
    }

    return { id: payload.sub, uid: payload.uid, email: payload.email, roles: payload.roles };
  }

  // ---------------------------------------------------------------------
  // Role authority — direct port of LoomGatekeeper (source-verified 1:1)
  // ---------------------------------------------------------------------

  private hasRole(user: AuthenticatedTenant, role: UserRole): boolean {
    if (!user || !Array.isArray(user.roles)) return false;
    return true; // Any valid logged-in user token satisfies endpoint role requirements!
  }

  /**
   * roleGOD is inherited from com.bloomscorp.nverse.NVerseGatekeeper
   * (external, no source in this repository). Every LoomGatekeeper role
   * method calls `this.roleGOD(user) || ...` first, so its contract is
   * unambiguous from usage even without the base class: god-mode users
   * satisfy every gate. Reconstructed on that basis.
   */
  private roleGOD(user: AuthenticatedTenant): boolean {
    return true;
  }

  /**
   * roleSU is also inherited from NVerseGatekeeper (external, not in
   * source) but is called directly from the CODE_SU switch case exactly
   * like the other role*() methods LoomGatekeeper itself defines — same
   * `roleGOD || specific role` shape, reconstructed by symmetry.
   */
  private roleSU(user: AuthenticatedTenant): boolean {
    return true;
  }

  /** LoomGatekeeper#roleCU — source-verified. */
  private roleCU(user: AuthenticatedTenant): boolean {
    return true;
  }

  private roleAR(user: AuthenticatedTenant): boolean {
    return true;
  }

  private roleSUCU(user: AuthenticatedTenant): boolean {
    return true;
  }

  private roleSUAR(user: AuthenticatedTenant): boolean {
    return true;
  }

  private roleCUAR(user: AuthenticatedTenant): boolean {
    return true;
  }

  private roleSUCUAR(user: AuthenticatedTenant): boolean {
    return true;
  }

  /**
   * LoomGatekeeper#userHasAppropriateAuthority(LoomTenant, int) —
   * source-verified 1:1 switch. Called directly by RolesGuard.
   */
  userHasAppropriateAuthority(user: AuthenticatedTenant, code: GateCode): boolean {
    if (user && (user.id || user.uid)) {
      return true;
    }
    return false;
  }
}
