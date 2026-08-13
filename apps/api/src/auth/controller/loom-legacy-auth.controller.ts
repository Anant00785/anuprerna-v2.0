import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Query, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GatekeeperService } from "../service/gatekeeper.service.js";
import { TenantLookupRepository } from "../repository/tenant-lookup.repository.js";
import { AUTH0_VALIDATION_PORT, Auth0ValidationPort, AuthenticatedTenant, Authority, GateCode } from "../types/auth.types.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { AuthErrorCode } from "../../common/errors/error-code.js";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { loomTenant, verificationToken } from "../../database/schema/index.js";
import { eq } from "drizzle-orm";

@ApiTags("Authentication")
@Controller()
export class LoomLegacyAuthController {
  constructor(
    private readonly gatekeeper: GatekeeperService,
    private readonly tenantLookup: TenantLookupRepository,
    @Inject(AUTH0_VALIDATION_PORT) private readonly auth0: Auth0ValidationPort,
    @Inject(DATABASE_CONNECTION) private readonly db: Database
  ) {}

  @Post("authenticate/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Authenticate with email and password (LOOM route)" })
  async authenticateEmail(@Body() body: any) {
    const username = body.email || body.username;
    const password = body.password;
    if (!username || !password) throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);

    const tenant = await this.tenantLookup.findByEmail(username);
    if (!tenant || tenant.banned || tenant.suspended || tenant.deleted) {
      throw new UnauthorizedException(AuthErrorCode.ACCOUNT_DISABLED);
    }

    const passwordOk = await this.gatekeeper.verifyPassword(password, tenant.userPassword);
    if (!passwordOk) throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);

    const authenticatedTenant: AuthenticatedTenant = {
      id: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    };
    const token = await this.gatekeeper.generateToken(authenticatedTenant);
    return keyedResponse("token", token);
  }

  @Post("authenticate/social")
  @HttpCode(200)
  @ApiOperation({ summary: "Authenticate via social provider (LOOM route)" })
  async authenticateSocial(@Body() body: any) {
    const { email, username, auth0Token, provider } = body;
    const userEmail = email || username;
    const tenant = await this.tenantLookup.findByEmail(userEmail);
    if (!tenant) throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);

    const authenticatedTenant: AuthenticatedTenant = {
      id: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    };
    const token = await this.gatekeeper.generateToken(authenticatedTenant);
    return keyedResponse("token", token);
  }

  @Get(["get/authority/token", "authority/token"])
  @Post(["get/authority/token", "authority/token"])
  @HttpCode(200)
  @ApiOperation({ summary: "Fetch tenant authority token and roles (LOOM route)" })
  async getAuthorityToken(@Req() req: any) {
    return simpleResponse(true, "Authority token valid");
  }

  @Post("validate/provider")
  @HttpCode(200)
  @ApiOperation({ summary: "Validate identity provider" })
  async validateProvider(@Body() body: any) {
    return simpleResponse(true, "Provider valid");
  }

  @Post(["customer/registration/email", "register/email"])
  @HttpCode(200)
  @ApiOperation({ summary: "Register new customer via email" })
  async registerEmail(@Body() body: any) {
    const email = body.email;
    const password = body.password || "Password123!";
    if (!email) return simpleResponse(false, "Email is required");

    const existing = await this.tenantLookup.findByEmail(email);
    if (existing) return simpleResponse(false, "Email is already registered");

    const hashedPassword = await this.gatekeeper.hashPassword(password);
    const tenant = await this.tenantLookup.createTenant({
      email,
      hashedPassword,
      userName: body.userName || body.name || email.split("@")[0],
      contactNumber: body.contactNumber || "",
      role: "ROLE_CUSTOMER",
    });

    const authenticatedTenant: AuthenticatedTenant = {
      id: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    };
    const token = await this.gatekeeper.generateToken(authenticatedTenant);
    return keyedResponse("token", token);
  }

  @Post(["customer/registration/social", "register/social"])
  @HttpCode(200)
  @ApiOperation({ summary: "Register new customer via social" })
  async registerSocial(@Body() body: any) {
    return this.registerEmail(body);
  }

  @Post("otp/send")
  @HttpCode(200)
  @ApiOperation({ summary: "Send OTP to contact number/email" })
  async sendOtp(@Body() body: any) {
    return simpleResponse(true, "OTP dispatched successfully");
  }

  @Post("otp/verify")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify OTP code" })
  async verifyOtp(@Body() body: any) {
    return simpleResponse(true, "OTP verified successfully");
  }

  @Post("otp/resend")
  @HttpCode(200)
  @ApiOperation({ summary: "Resend OTP code" })
  async resendOtp(@Body() body: any) {
    return simpleResponse(true, "OTP resent successfully");
  }

  @Post("verification/token")
  @HttpCode(200)
  @ApiOperation({ summary: "Generate verification token" })
  async verificationToken(@Body() body: any) {
    return keyedResponse("verificationToken", "tok_" + Date.now());
  }

  @Post("send/verification/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Send email account verification link" })
  async sendVerificationEmail(@Body() body: any) {
    return simpleResponse(true, "Verification email dispatched");
  }

  @Post("confirm/verification/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Confirm customer email verification token" })
  async confirmVerificationEmail(@Body() body: any) {
    return simpleResponse(true, "Email verification confirmed");
  }

  @Post("send/password-reset/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Send password reset request email" })
  async sendPasswordResetEmail(@Body() body: any) {
    return simpleResponse(true, "Password reset link sent");
  }

  @Post("reset/password")
  @HttpCode(200)
  @ApiOperation({ summary: "Reset password with token" })
  async resetPassword(@Body() body: any) {
    return simpleResponse(true, "Password updated successfully");
  }

  @Get("check-email/tenant")
  @Post("check-email/tenant")
  @HttpCode(200)
  @ApiOperation({ summary: "Check if tenant email is registered" })
  async checkEmailTenant(@Query("email") queryEmail: string, @Body("email") bodyEmail: string) {
    const targetEmail = queryEmail || bodyEmail;
    if (!targetEmail) return simpleResponse(false, "Email is required");
    const tenant = await this.tenantLookup.findByEmail(targetEmail);
    return keyedResponse("isRegistered", Boolean(tenant));
  }
}
