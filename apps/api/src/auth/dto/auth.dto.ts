/**
 * apps/api/src/auth/dto/auth.dto.ts
 *
 * Request DTOs for AuthController, one per NverseAuthenticationController
 * handler:
 *  - createAuthenticationTokenUsingEmailID(NVerseRequest)        -> parseEmailLoginRequest
 *  - createAuthenticationTokenUsingSocialID(NVerseSocialRequest) -> parseSocialLoginRequest
 *  - validateProvider(NVerseAuthProviderValidationRequest)      -> parseValidateProviderRequest
 *
 * Length bounds mirror PasswordValidator ("^.{8,38}$") and EmailValidator
 * ("^.{3,60}$") exactly. EmailValidator's deeper checks
 * (NVerseEmailValidator's format validation, NVerseEmailEncoder's
 * encode/matches round-trip) depend on external `com.bloomscorp.nverse`
 * classes with no source in this repository — out of scope here; only the
 * length/shape bound that source itself hard-codes is reproduced.
 *
 * No validation library is installed in this project, so parsing is
 * hand-written.
 */
import { BadRequestException } from "@nestjs/common";
import { AUTH_PROVIDERS, AuthProvider } from "../types/auth.types.js";

const EMAIL_PATTERN = /^.{3,60}$/s;
const PASSWORD_PATTERN = /^.{8,38}$/s;

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new BadRequestException(`${field} must be a non-empty string.`);
  }
  return value;
}

function requireEmailShape(value: unknown): string {
  const email = requireNonEmptyString(value, "username");
  if (!EMAIL_PATTERN.test(email)) {
    throw new BadRequestException("username must be between 3 and 60 characters.");
  }
  return email;
}

function requirePasswordShape(value: unknown): string {
  const password = requireNonEmptyString(value, "password");
  if (!PASSWORD_PATTERN.test(password)) {
    throw new BadRequestException("password must be between 8 and 38 characters.");
  }
  return password;
}

function requireProvider(value: unknown): AuthProvider {
  if (typeof value !== "string" || !(AUTH_PROVIDERS as readonly string[]).includes(value)) {
    throw new BadRequestException(`provider must be one of ${AUTH_PROVIDERS.join(", ")}.`);
  }
  return value as AuthProvider;
}

/** NVerseRequest(username, password) — email/password login body. */
export interface EmailLoginRequest {
  username: string;
  password: string;
}

export function parseEmailLoginRequest(body: unknown): EmailLoginRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    username: requireEmailShape(b.username),
    password: requirePasswordShape(b.password),
  };
}

/** NVerseSocialRequest(username, password [auth0 JWT], provider) */
export interface SocialLoginRequest {
  username: string;
  auth0Token: string;
  provider: AuthProvider;
}

export function parseSocialLoginRequest(body: unknown): SocialLoginRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    username: requireEmailShape(b.username),
    auth0Token: requireNonEmptyString(b.password, "password"),
    provider: requireProvider(b.provider),
  };
}

/** NVerseAuthProviderValidationRequest(username, provider) */
export interface ValidateProviderRequest {
  username: string;
  provider: AuthProvider;
}

export function parseValidateProviderRequest(body: unknown): ValidateProviderRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    username: requireEmailShape(b.username),
    provider: requireProvider(b.provider),
  };
}