/**
 * apps/api/src/auth/service/auth0-validation.service.ts
 *
 * Real implementation of Auth0ValidationPort — port of
 * com.bloomscorp.loom.tenant.service.Auth0Service.
 *
 * The Java verifier applied exactly three checks, all reproduced here:
 *   1. RS256 signature against the tenant JWKS (`<issuer>.well-known/jwks.json`)
 *   2. `withIssuer(issuer)`
 *   3. `withClaim("email", email)` — the token's email must be the email
 *      being authenticated, otherwise any valid Auth0 token for tenant X
 *      would authenticate as tenant Y.
 *
 * SECURITY: this is an authentication control. It must never answer `false`
 * for a *configuration* problem — a validator that quietly rejects
 * everything is indistinguishable from one that quietly accepts everything
 * once someone "fixes" it by inverting the check. Missing AUTH0_ISSUER
 * throws loudly; only a genuinely bad token returns `false`, matching the
 * Java `catch (JWTVerificationException | JwkException) { return false; }`.
 */
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose";
import type { Auth0ValidationPort } from "../types/auth.types.js";

@Injectable()
export class Auth0ValidationService implements Auth0ValidationPort {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private jwksIssuer = "";

  /** `auth0.jwt.issuer` in the Spring config. Trailing slash is part of an Auth0 issuer. */
  private get issuer(): string {
    const configured = process.env.AUTH0_ISSUER?.trim();
    if (!configured) {
      throw new ServiceUnavailableException(
        "Auth0ValidationPort: social login is not configured — set AUTH0_ISSUER " +
          "(e.g. https://<tenant>.us.auth0.com/) before using the Auth0 login endpoints.",
      );
    }
    return configured.endsWith("/") ? configured : `${configured}/`;
  }

  /** JwkProviderBuilder(...).cached(...) — jose caches and rate-limits the remote set itself. */
  private keySet(issuer: string) {
    if (!this.jwks || this.jwksIssuer !== issuer) {
      this.jwks = createRemoteJWKSet(new URL(`${issuer}.well-known/jwks.json`));
      this.jwksIssuer = issuer;
    }
    return this.jwks;
  }

  /** Auth0Service#validateToken(String token, String email) */
  async validateToken(token: string, email: string): Promise<boolean> {
    const issuer = this.issuer; // throws when unconfigured — never a silent false
    if (!token || !email) return false;

    try {
      const { payload } = await jwtVerify(token, this.keySet(issuer), { issuer });
      return payload.email === email;
    } catch {
      return false;
    }
  }

  /** Auth0Service#getUserFromToken(String token) — the `sub` claim, decoded (not verified), as in source. */
  async getUserFromToken(token: string): Promise<string> {
    try {
      return decodeJwt(token).sub ?? "";
    } catch {
      return "";
    }
  }
}
