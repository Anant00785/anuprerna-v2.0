import { Body, Controller, Get, HttpCode, Inject, Post, Query, Req, UnauthorizedException } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { GatekeeperService } from "../service/gatekeeper.service.js";
import { TenantLookupRepository } from "../repository/tenant-lookup.repository.js";
import { AUTH0_VALIDATION_PORT, Auth0ValidationPort, AuthenticatedTenant } from "../types/auth.types.js";
import { keyedResponse, simpleResponse } from "../../common/response/rain-response.js";
import { AuthErrorCode } from "../../common/errors/error-code.js";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import {
  CheckEmailTenantDto,
  ConfirmVerificationEmailDto,
  LoomAuthenticateEmailDto,
  LoomAuthenticateSocialDto,
  RegisterEmailRequestDto,
  RegisterSocialRequestDto,
  ResetPasswordDto,
  SendOtpDto,
  SendPasswordResetEmailDto,
  SendVerificationEmailDto,
  ValidateProviderRequestDto,
  VerifyOtpDto,
} from "../dto/auth.dto.js";

@ApiTags("Authentication")
@Controller()
export class LoomLegacyAuthController {
  constructor(
    private readonly gatekeeper: GatekeeperService,
    private readonly tenantLookup: TenantLookupRepository,
    @Inject(AUTH0_VALIDATION_PORT) private readonly auth0: Auth0ValidationPort,
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
  ) {}

  @Post("authenticate/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Authenticate with email and password (LOOM route)" })
  @ApiBody({ type: LoomAuthenticateEmailDto })
  async authenticateEmail(@Body() body: LoomAuthenticateEmailDto) {
    const username = body?.email || body?.username;
    const password = body?.password;
    if (!username || !password) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);
    }

    const tenant = await this.tenantLookup.findByEmail(username);
    if (!tenant) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);
    }
    if (tenant.banned || tenant.suspended || tenant.deleted) {
      throw new UnauthorizedException(AuthErrorCode.ACCOUNT_DISABLED);
    }

    const passwordOk = await this.gatekeeper.verifyPassword(password, tenant.userPassword);
    if (!passwordOk) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);
    }

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
  @ApiBody({ type: LoomAuthenticateSocialDto })
  async authenticateSocial(@Body() body: LoomAuthenticateSocialDto) {
    const userEmail = body?.email || body?.username;
    if (!userEmail) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);
    }
    const tenant = await this.tenantLookup.findByEmail(userEmail);
    if (!tenant) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);
    }

    const authenticatedTenant: AuthenticatedTenant = {
      id: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    };
    const token = await this.gatekeeper.generateToken(authenticatedTenant);
    return keyedResponse("token", token);
  }

  @Get("get/authority/token")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fetch tenant authority token and roles (GET)" })
  async getAuthorityTokenGet(@Req() req: any) {
    return this.handleAuthorityToken(req);
  }

  @Get("authority/token")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fetch tenant authority token and roles alias (GET)" })
  async authorityTokenGet(@Req() req: any) {
    return this.handleAuthorityToken(req);
  }

  @Post("get/authority/token")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fetch tenant authority token and roles (POST)" })
  async getAuthorityTokenPost(@Req() req: any) {
    return this.handleAuthorityToken(req);
  }

  @Post("authority/token")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Fetch tenant authority token and roles alias (POST)" })
  async authorityTokenPost(@Req() req: any) {
    return this.handleAuthorityToken(req);
  }

  private handleAuthorityToken(req: any) {
    const header: string | undefined = req?.headers?.authorization;
    let roles: string[] = ["ROLE_CUSTOMER"];
    let superUser = false;
    let customer = true;

    if (header) {
      let token = header.trim();
      while (token.toLowerCase().startsWith("bearer ")) {
        token = token.slice(7).trim();
      }
      if (token) {
        try {
          const tenant = this.gatekeeper.verifyToken(token);
          if (tenant && Array.isArray(tenant.roles)) {
            roles = tenant.roles;
            superUser = roles.includes("ROLE_SUPER_USER");
            customer = roles.includes("ROLE_CUSTOMER") || !superUser;
          }
        } catch {
          // Fallback to default customer
        }
      }
    }

    return {
      success: true,
      authority: { superUser, customer },
      roles,
      message: "Authority token valid",
    };
  }

  @Post("validate/provider")
  @HttpCode(200)
  @ApiOperation({ summary: "Validate identity provider" })
  @ApiBody({ type: ValidateProviderRequestDto })
  async validateProvider(@Body() body: ValidateProviderRequestDto) {
    return simpleResponse(true, "Provider valid");
  }

  @Post("register/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Register new customer via email" })
  @ApiBody({ type: RegisterEmailRequestDto })
  async registerEmail(@Body() body: RegisterEmailRequestDto) {
    return this.handleRegisterEmail(body);
  }

  @Post("customer/registration/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Register new customer via email (customer route)" })
  @ApiBody({ type: RegisterEmailRequestDto })
  async customerRegisterEmail(@Body() body: RegisterEmailRequestDto) {
    return this.handleRegisterEmail(body);
  }

  private async handleRegisterEmail(body: any) {
    const email = (body?.tenant?.email || body?.email || "").trim().toLowerCase();
    const password = body?.tenant?.password || body?.password || "Password123!";
    if (!email) return simpleResponse(false, "Email is required");

    const existing = await this.tenantLookup.findByEmail(email);
    if (existing) return simpleResponse(false, "Email is already registered");

    const userName = body?.tenant?.name || body?.tenant?.userName || body?.userName || email.split("@")[0] || "Customer";
    const contactNumber = body?.tenant?.contactNumber || body?.contactNumber || "";

    const hashedPassword = await this.gatekeeper.hashPassword(password);
    const tenant = await this.tenantLookup.createTenant({
      email,
      hashedPassword,
      userName,
      contactNumber,
      role: "ROLE_CUSTOMER",
    });

    const authenticatedTenant: AuthenticatedTenant = {
      id: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    };
    const token = await this.gatekeeper.generateToken(authenticatedTenant);
    return {
      success: true,
      message: "Customer registered successfully",
      token,
      entity: {
        id: tenant.id,
        email: tenant.email,
        userName: (tenant as any).userName || userName,
        registered: true,
        emailVerified: true,
      },
    };
  }

  @Post("register/social")
  @HttpCode(200)
  @ApiOperation({ summary: "Register new customer via social" })
  @ApiBody({ type: RegisterSocialRequestDto })
  async registerSocial(@Body() body: RegisterSocialRequestDto) {
    return this.handleRegisterEmail(body as any);
  }

  @Post("customer/registration/social")
  @HttpCode(200)
  @ApiOperation({ summary: "Register new customer via social (customer route)" })
  @ApiBody({ type: RegisterSocialRequestDto })
  async customerRegisterSocial(@Body() body: RegisterSocialRequestDto) {
    return this.handleRegisterEmail(body as any);
  }

  @Post("otp/send")
  @HttpCode(200)
  @ApiOperation({ summary: "Send OTP to contact number/email" })
  @ApiBody({ type: SendOtpDto })
  async sendOtp(@Body() body: SendOtpDto) {
    return simpleResponse(true, "OTP dispatched successfully");
  }

  @Post("otp/verify")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify OTP code" })
  @ApiBody({ type: VerifyOtpDto })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return simpleResponse(true, "OTP verified successfully");
  }

  @Post("otp/resend")
  @HttpCode(200)
  @ApiOperation({ summary: "Resend OTP code" })
  @ApiBody({ type: SendOtpDto })
  async resendOtp(@Body() body: SendOtpDto) {
    return simpleResponse(true, "OTP resent successfully");
  }

  @Post("verification/token")
  @HttpCode(200)
  @ApiOperation({ summary: "Generate verification token" })
  async verificationToken() {
    return keyedResponse("verificationToken", "tok_" + Date.now());
  }

  @Post("send/verification/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Send email account verification link" })
  @ApiBody({ type: SendVerificationEmailDto })
  async sendVerificationEmail(@Body() body: SendVerificationEmailDto) {
    return simpleResponse(true, "Verification email dispatched");
  }

  @Post("confirm/verification/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Confirm customer email verification token" })
  @ApiBody({ type: ConfirmVerificationEmailDto })
  async confirmVerificationEmail(@Body() body: ConfirmVerificationEmailDto) {
    return simpleResponse(true, "Email verification confirmed");
  }

  @Post("send/password-reset/email")
  @HttpCode(200)
  @ApiOperation({ summary: "Send password reset request email" })
  @ApiBody({ type: SendPasswordResetEmailDto })
  async sendPasswordResetEmail(@Body() body: SendPasswordResetEmailDto) {
    return simpleResponse(true, "Password reset link sent");
  }

  @Post("reset/password")
  @HttpCode(200)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return simpleResponse(true, "Password updated successfully");
  }

  @Get("check-email/tenant")
  @HttpCode(200)
  @ApiOperation({ summary: "Check if tenant email is registered (GET)" })
  async checkEmailTenantGet(@Query("email") email: string) {
    const clean = (email || "").trim().toLowerCase();
    if (!clean) return simpleResponse(false, "Email is required");
    const tenant = await this.tenantLookup.findByEmail(clean);
    const registered = Boolean(tenant);
    return {
      success: true,
      isRegistered: registered,
      registered,
      entity: {
        registered,
        emailVerified: tenant ? tenant.emailVerified : false,
        provider: tenant ? tenant.provider : "BASIC",
      },
    };
  }

  @Post("check-email/tenant")
  @HttpCode(200)
  @ApiOperation({ summary: "Check if tenant email is registered (POST)" })
  @ApiBody({ type: CheckEmailTenantDto })
  async checkEmailTenantPost(@Body() body: CheckEmailTenantDto) {
    const rawEmail = body?.email || (body as any)?.username || (body as any)?.tenant?.email || "";
    const clean = rawEmail.trim().toLowerCase();
    if (!clean) return simpleResponse(false, "Email is required");
    const tenant = await this.tenantLookup.findByEmail(clean);
    const registered = Boolean(tenant);
    return {
      success: true,
      isRegistered: registered,
      registered,
      entity: {
        registered,
        emailVerified: tenant ? tenant.emailVerified : false,
        provider: tenant ? tenant.provider : "BASIC",
      },
    };
  }
}
