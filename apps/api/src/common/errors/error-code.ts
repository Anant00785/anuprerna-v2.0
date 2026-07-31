/**
 * apps/api/src/common/errors/error-code.ts
 *
 * Auth-domain error codes. com.bloomscorp.hastar.AuthorizationException is
 * an external class (package com.bloomscorp.hastar, not present in this
 * repository) — only ONE of its codes is source-verified: AECx01, thrown
 * literally as `new AuthorizationException(AuthorizationException.AECx01)`
 * in NverseAuthenticationController for both the email and social login
 * handlers when username/password/provider is empty or invalid-shaped.
 *
 * The remaining codes below are NOT source-verified numeric constants —
 * AuthorizationException's full code table isn't in the uploaded
 * repository. They are sequential placeholders (AECx02..AECx05) added so
 * auth.controller.ts has a distinct, stable code per distinct failure path
 * the source controller actually throws for (BadCredentialsException,
 * DisabledException, and the Auth0 token-invalid branch). Confirm the real
 * values against a live AuthorizationException.class dump before treating
 * these as a public API contract.
 */
export const AuthErrorCode = {
  /** source-verified: AuthorizationException.AECx01 — empty/missing username or password. */
  MISSING_CREDENTIALS: "AECx01",
  /** reconstructed: corresponds to the BadCredentialsException path (wrong password / unknown user). */
  INVALID_CREDENTIALS: "AECx02",
  /** reconstructed: corresponds to the DisabledException path (banned/suspended/deleted account). */
  ACCOUNT_DISABLED: "AECx03",
  /** reconstructed: corresponds to `auth0.validateToken(...)` returning false in createAuthenticationTokenUsingSocialID. */
  INVALID_PROVIDER_TOKEN: "AECx04",
  /** reconstructed: corresponds to LoomGatekeeper#userHasAppropriateAuthority returning false. */
  UNAUTHORIZED_ROLE: "AECx05",
} as const;

export type AuthErrorCodeValue = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];