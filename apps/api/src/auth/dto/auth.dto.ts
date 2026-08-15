import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
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

/** Swagger schema for the email-login request body. */
export class EmailLoginRequestDto {
  @ApiProperty({ example: "user@example.com", description: "Account email/username." })
  @IsString()
  username!: string;

  @ApiProperty({ example: "Password123!", minLength: 8, maxLength: 38, description: "Account password." })
  @IsString()
  password!: string;
}

/** Legacy LOOM email authentication body */
export class LoomAuthenticateEmailDto {
  @ApiPropertyOptional({ example: "user@example.com", description: "Account email address." })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "Account username." })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: "Password123!", description: "Account password." })
  @IsString()
  password!: string;
}

/** Swagger schema for social login request body. */
export class SocialLoginRequestDto {
  @ApiProperty({ example: "user@example.com", description: "Account email/username." })
  @IsString()
  username!: string;

  @ApiProperty({ example: "eyJhbGciOiJSUzI1NiIs...", description: "Auth0/Social Token." })
  @IsString()
  password!: string;

  @ApiProperty({ example: "GOOGLE", description: "Auth Provider (GOOGLE, FACEBOOK, APPLE, etc.)." })
  @IsString()
  provider!: string;
}

/** Legacy LOOM social authentication body */
export class LoomAuthenticateSocialDto {
  @ApiPropertyOptional({ example: "user@example.com", description: "Account email address." })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "Account username." })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: "eyJhbGciOiJSUzI1NiIs...", description: "Auth0 / Social Token." })
  @IsOptional()
  @IsString()
  auth0Token?: string;

  @ApiPropertyOptional({ example: "GOOGLE", description: "Auth Provider (GOOGLE, FACEBOOK, APPLE, etc.)." })
  @IsOptional()
  @IsString()
  provider?: string;
}

/** Swagger schema for validate provider request body. */
export class ValidateProviderRequestDto {
  @ApiProperty({ example: "user@example.com", description: "Account username/email." })
  @IsString()
  username!: string;

  @ApiProperty({ example: "GOOGLE", description: "Auth Provider to check." })
  @IsString()
  provider!: string;
}

/** Swagger schema for customer registration request body. */
export class RegisterRequestDto {
  @ApiProperty({ example: "newuser@example.com", description: "Account email address." })
  @IsString()
  email!: string;

  @ApiProperty({ example: "Password123!", minLength: 8, maxLength: 38, description: "Account password." })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ example: "Rahul Sharma", description: "User full name." })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ example: "+919876543210", description: "User contact phone number." })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ example: "ROLE_CUSTOMER", description: "Optional role (e.g. ROLE_CUSTOMER, ROLE_SUPER_USER)." })
  @IsOptional()
  @IsString()
  role?: string;
}

/** Swagger schema for Email specific registration. */
export class RegisterEmailRequestDto {
  @ApiProperty({ example: "newuser@example.com", description: "Account email address." })
  @IsString()
  email!: string;

  @ApiProperty({ example: "Password123!", minLength: 8, maxLength: 38, description: "Account password." })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: "Rahul Sharma", description: "User full name." })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ example: "+919876543210", description: "User contact phone number." })
  @IsOptional()
  @IsString()
  contactNumber?: string;
}

/** Swagger schema for Social specific registration. */
export class RegisterSocialRequestDto {
  @ApiProperty({ example: "socialuser@example.com", description: "Account email address." })
  @IsString()
  email!: string;

  @ApiProperty({ example: "GOOGLE", description: "Social Provider (GOOGLE, FACEBOOK, APPLE)." })
  @IsString()
  provider!: string;

  @ApiPropertyOptional({ example: "eyJhbGciOiJSUzI1NiIs...", description: "Auth0/Social Token." })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ example: "Priya Das", description: "User full name." })
  @IsOptional()
  @IsString()
  userName?: string;
}

export class SendOtpDto {
  @ApiPropertyOptional({ example: "+919876543210", description: "Target mobile number" })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "Target email address" })
  @IsOptional()
  @IsString()
  email?: string;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ example: "+919876543210", description: "Mobile number or email" })
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "Target email address" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: "1234", description: "OTP verification code" })
  @IsString()
  otp!: string;
}

export class SendVerificationEmailDto {
  @ApiProperty({ example: "user@example.com", description: "Account email address" })
  @IsString()
  email!: string;
}

export class ConfirmVerificationEmailDto {
  @ApiProperty({ example: "tok_1234567890", description: "Verification token received in email" })
  @IsString()
  token!: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "Account email" })
  @IsOptional()
  @IsString()
  email?: string;
}

export class SendPasswordResetEmailDto {
  @ApiProperty({ example: "user@example.com", description: "Account email address" })
  @IsString()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "tok_reset_12345", description: "Password reset token" })
  @IsString()
  token!: string;

  @ApiProperty({ example: "NewPassword123!", description: "New password" })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "Account email address" })
  @IsOptional()
  @IsString()
  email?: string;
}

export class CheckEmailTenantDto {
  @ApiProperty({ example: "user@example.com", description: "Email address to check" })
  @IsString()
  email!: string;
}

/** NVerseRequest(username, password) — email/password login body. */
export interface EmailLoginRequest {
  username: string;
  password: string;
}

export function parseEmailLoginRequest(body: unknown): EmailLoginRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    username: requireEmailShape(b.username ?? b.email),
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
    username: requireEmailShape(b.username ?? b.email),
    auth0Token: typeof b.password === "string" ? b.password : (typeof b.auth0Token === "string" ? b.auth0Token : (typeof b.token === "string" ? b.token : "social-token")),
    provider: (b.provider as AuthProvider) || "GOOGLE",
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
    username: requireEmailShape(b.username ?? b.email),
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
  const password = typeof b.password === "string" && b.password.length > 0 ? b.password : "Password123!";
  const userName = typeof b.userName === "string" ? b.userName : (typeof b.name === "string" ? b.name : email.split("@")[0]);
  const contactNumber = typeof b.contactNumber === "string" ? b.contactNumber : (typeof b.phone === "string" ? b.phone : "");
  const role = typeof b.role === "string" ? b.role : undefined;

  return { email, password, userName, contactNumber, role };
}
