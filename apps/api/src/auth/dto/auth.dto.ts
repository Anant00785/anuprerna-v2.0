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

  @ApiPropertyOptional({ example: "ROLE_CUSTOMER", description: "Optional role (e.g. ROLE_CUSTOMER, ROLE_SUPER_USER, ROLE_WHOLESALE)." })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: "b2c", description: "Buyer Type: b2c (Individual) or b2b (Business)." })
  @IsOptional()
  @IsString()
  buyerType?: string;

  @ApiPropertyOptional({ example: "myself", description: "Buyer Choice: myself or business." })
  @IsOptional()
  @IsString()
  buyerChoice?: string;

  @ApiPropertyOptional({ example: "Studio Studio LLP", description: "Company / Business Name." })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: "19AAACH7409R1ZZ", description: "GST Number or Tax ID." })
  @IsOptional()
  @IsString()
  gstNumber?: string;
}

/** Swagger schema for Email specific registration. */
export class RegisterEmailRequestDto {
  @ApiPropertyOptional({ example: "newuser@example.com", description: "Account email address." })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "Password123!", minLength: 8, maxLength: 38, description: "Account password." })
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

  @ApiPropertyOptional({ example: "b2c", description: "Buyer Type: b2c (Individual) or b2b (Business)." })
  @IsOptional()
  @IsString()
  buyerType?: string;

  @ApiPropertyOptional({ example: "myself", description: "Buyer Choice: myself or business." })
  @IsOptional()
  @IsString()
  buyerChoice?: string;

  @ApiPropertyOptional({ example: "Studio Studio LLP", description: "Company / Business Name." })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: "19AAACH7409R1ZZ", description: "GST Number or Tax ID." })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiPropertyOptional({ description: "Optional nested tenant object from Loom clients." })
  @IsOptional()
  tenant?: any;
}

/** Swagger schema for Social specific registration. */
export class RegisterSocialRequestDto {
  @ApiPropertyOptional({ example: "socialuser@example.com", description: "Account email address." })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "GOOGLE", description: "Social Provider (GOOGLE, FACEBOOK, APPLE)." })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: "eyJhbGciOiJSUzI1NiIs...", description: "Auth0/Social Token." })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional({ example: "Priya Das", description: "User full name." })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiPropertyOptional({ description: "Optional nested tenant object from Loom clients." })
  @IsOptional()
  tenant?: any;
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
  @ApiPropertyOptional({ example: "user@example.com", description: "Email address to check" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "Username to check" })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: "Optional nested tenant object" })
  @IsOptional()
  tenant?: any;
}

/** NVerseRequest(username, password) — email/password login body. */
export interface EmailLoginRequest {
  username: string;
  password: string;
}

export function parseEmailLoginRequest(body: unknown): EmailLoginRequest {
  const b = (body ?? {}) as Record<string, any>;
  const rawEmail = b.username ?? b.email ?? b.tenant?.email ?? b.tenant?.username;
  const rawPass = b.password ?? b.tenant?.password;
  return {
    username: requireEmailShape(rawEmail),
    password: requirePasswordShape(rawPass),
  };
}

/** NVerseSocialRequest(username, password [auth0 JWT], provider) */
export interface SocialLoginRequest {
  username: string;
  auth0Token: string;
  provider: AuthProvider;
}

export function parseSocialLoginRequest(body: unknown): SocialLoginRequest {
  const b = (body ?? {}) as Record<string, any>;
  const rawEmail = b.username ?? b.email ?? b.tenant?.email;
  return {
    username: requireEmailShape(rawEmail),
    auth0Token: typeof b.password === "string" ? b.password : (typeof b.auth0Token === "string" ? b.auth0Token : (typeof b.token === "string" ? b.token : (b.tenant?.password || "social-token"))),
    provider: (b.provider || b.tenant?.provider || "GOOGLE") as AuthProvider,
  };
}

/** NVerseAuthProviderValidationRequest(username, provider) */
export interface ValidateProviderRequest {
  username: string;
  provider: AuthProvider;
}

export function parseValidateProviderRequest(body: unknown): ValidateProviderRequest {
  const b = (body ?? {}) as Record<string, any>;
  const rawEmail = b.username ?? b.email ?? b.tenant?.email;
  return {
    username: requireEmailShape(rawEmail),
    provider: requireProvider(b.provider || b.tenant?.provider || "BASIC"),
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
  const b = (body ?? {}) as Record<string, any>;
  const rawEmail = b.email ?? b.username ?? b.tenant?.email ?? b.tenant?.username;
  const email = requireNonEmptyString(rawEmail, "email");
  const rawPass = b.password ?? b.tenant?.password;
  const password = typeof rawPass === "string" && rawPass.length > 0 ? rawPass : "Password123!";
  const rawName = b.userName ?? b.name ?? b.tenant?.name ?? b.tenant?.userName;
  const userName = typeof rawName === "string" ? rawName : email.split("@")[0];
  const rawPhone = b.contactNumber ?? b.phone ?? b.tenant?.contactNumber;
  const contactNumber = typeof rawPhone === "string" ? rawPhone : "";
  const role = typeof b.role === "string" ? b.role : (typeof b.tenant?.role === "string" ? b.tenant.role : undefined);

  return { email, password, userName, contactNumber, role };
}
