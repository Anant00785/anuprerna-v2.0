import { BadRequestException } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
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

/** Swagger schema for the existing email-login request body. */
export class EmailLoginRequestDto {
  @ApiProperty({ example: "user@example.com", description: "Account username/email." })
  username!: string;

  @ApiProperty({ example: "password123", minLength: 8, maxLength: 38, description: "Account password." })
  password!: string;
}

/** Swagger schema for social login request body. */
export class SocialLoginRequestDto {
  @ApiProperty({ example: "user@example.com", description: "Account username/email." })
  username!: string;

  @ApiProperty({ example: "eyJhbGciOiJSUzI1NiIs...", description: "Auth0/Social Token." })
  password!: string;

  @ApiProperty({ example: "GOOGLE", description: "Auth Provider (GOOGLE, FACEBOOK, APPLE, etc.)." })
  provider!: string;
}

/** Swagger schema for validate provider request body. */
export class ValidateProviderRequestDto {
  @ApiProperty({ example: "user@example.com", description: "Account username/email." })
  username!: string;

  @ApiProperty({ example: "GOOGLE", description: "Auth Provider to check." })
  provider!: string;
}

/** Swagger schema for customer registration request body. */
export class RegisterRequestDto {
  @ApiProperty({ example: "newuser@example.com", description: "Account email address." })
  email!: string;

  @ApiProperty({ example: "password123", minLength: 8, maxLength: 38, description: "Account password." })
  password!: string;

  @ApiProperty({ example: "Rahul Sharma", required: false, description: "User full name." })
  userName?: string;

  @ApiProperty({ example: "+919876543210", required: false, description: "User contact phone number." })
  contactNumber?: string;

  @ApiProperty({ example: "ROLE_CUSTOMER", required: false, description: "Optional role (e.g. ROLE_CUSTOMER, ROLE_SUPER_USER)." })
  role?: string;
}

/** Swagger schema for Email specific registration. */
export class RegisterEmailRequestDto {
  @ApiProperty({ example: "newuser@example.com", description: "Account email address." })
  email!: string;

  @ApiProperty({ example: "password123", minLength: 8, maxLength: 38, description: "Account password." })
  password!: string;

  @ApiProperty({ example: "Rahul Sharma", required: false, description: "User full name." })
  userName?: string;

  @ApiProperty({ example: "+919876543210", required: false, description: "User contact phone number." })
  contactNumber?: string;
}

/** Swagger schema for Social specific registration. */
export class RegisterSocialRequestDto {
  @ApiProperty({ example: "socialuser@example.com", description: "Account email address." })
  email!: string;

  @ApiProperty({ example: "GOOGLE", description: "Social Provider (GOOGLE, FACEBOOK, APPLE)." })
  provider!: string;

  @ApiProperty({ example: "eyJhbGciOiJSUzI1NiIs...", description: "Auth0/Social Token." })
  token!: string;

  @ApiProperty({ example: "Priya Das", required: false, description: "User full name." })
  userName?: string;
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
    auth0Token: requireNonEmptyString(b.password ?? b.auth0Token, "password"),
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

export interface RegisterRequest {
  email: string;
  password: string;
  userName?: string;
  contactNumber?: string;
  role?: string;
}

export function parseRegisterRequest(body: unknown): RegisterRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = requireNonEmptyString(b.email ?? b.username, "email");
  const password = typeof b.password === "string" ? requirePasswordShape(b.password) : "SocialUserPass123!";
  const userName = typeof b.userName === "string" ? b.userName : (typeof b.name === "string" ? b.name : email.split("@")[0]);
  const contactNumber = typeof b.contactNumber === "string" ? b.contactNumber : (typeof b.phone === "string" ? b.phone : "");
  const role = typeof b.role === "string" ? b.role : undefined;

  return { email, password, userName, contactNumber, role };
}
