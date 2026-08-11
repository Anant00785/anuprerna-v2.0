import { BadRequestException, Body, Controller, Get, HttpCode, Inject, Post, UnauthorizedException, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GatekeeperService } from "../service/gatekeeper.service.js";
import { TenantLookupRepository } from "../repository/tenant-lookup.repository.js";
import {
  AUTH0_VALIDATION_PORT,
  AUTH_PROVIDERS,
  Auth0ValidationPort,
  AuthenticatedTenant,
  Authority,
  GateCode,
} from "../types/auth.types.js";
import {
  EmailLoginRequestDto,
  RegisterEmailRequestDto,
  RegisterRequestDto,
  RegisterSocialRequestDto,
  SocialLoginRequestDto,
  ValidateProviderRequestDto,
  parseEmailLoginRequest,
  parseRegisterRequest,
  parseSocialLoginRequest,
  parseValidateProviderRequest,
} from "../dto/auth.dto.js";
import { RolesGuard, RequireGate } from "../../common/auth/roles.guard.js";
import { CurrentTenant } from "../../common/auth/current-tenant.decorator.js";
import { keyedResponse } from "../../common/response/rain-response.js";
import { AuthErrorCode } from "../../common/errors/error-code.js";

@ApiTags("Authentication")
@Controller("auth")
@UseGuards(RolesGuard)
export class AuthController {
  constructor(
    private readonly gatekeeper: GatekeeperService,
    private readonly tenantLookup: TenantLookupRepository,
    @Inject(AUTH0_VALIDATION_PORT) private readonly auth0: Auth0ValidationPort,
  ) {}

  /** createAuthenticationTokenUsingEmailID(NVerseRequest) — public, no @RequireGate. */
  @Post("authenticate/email")
  @HttpCode(200)
  @ApiBody({ type: EmailLoginRequestDto })
  @ApiOperation({ summary: "Authenticate with email and password, issuing a JWT." })
  @ApiResponse({ status: 200, description: "Authentication succeeded; JWT token returned." })
  @ApiResponse({ status: 400, description: "Malformed username/password." })
  @ApiResponse({ status: 401, description: "Invalid credentials or a disabled account." })
  async authenticateWithEmail(@Body() body: unknown) {
    const { username, password } = parseEmailLoginRequest(body);

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
    const token = this.gatekeeper.generateToken(authenticatedTenant);

    void this.tenantLookup.updateLoginMetadata(tenant.id, {
      lastAccessTime: Date.now(),
      provider: "BASIC",
    });

    return keyedResponse("token", token);
  }

  /** Register a new user with email and password, issuing a JWT. */
  @Post("register")
  @HttpCode(200)
  @ApiBody({ type: RegisterRequestDto })
  @ApiOperation({ summary: "Register a new customer user and issue a JWT token." })
  @ApiResponse({ status: 200, description: "Registration succeeded; JWT token returned." })
  @ApiResponse({ status: 400, description: "Email already registered or invalid inputs." })
  async registerUser(@Body() body: unknown) {
    const { email, password, userName, contactNumber, role } = parseRegisterRequest(body);

    const existing = await this.tenantLookup.findByEmail(email);
    if (existing) {
      throw new BadRequestException("Email is already registered.");
    }

    const hashedPassword = await this.gatekeeper.hashPassword(password);
    const tenant = await this.tenantLookup.createTenant({
      email,
      hashedPassword,
      userName: userName || email.split("@")[0],
      contactNumber: contactNumber || "",
      role: role || "ROLE_CUSTOMER",
    });

    const authenticatedTenant: AuthenticatedTenant = {
      id: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    };

    const token = this.gatekeeper.generateToken(authenticatedTenant);
    return keyedResponse("token", token);
  }

  /** Register user specifically via Email */
  @Post("register/email")
  @HttpCode(200)
  @ApiBody({ type: RegisterEmailRequestDto })
  @ApiOperation({ summary: "Register user via Email and Password." })
  @ApiResponse({ status: 200, description: "Registration succeeded; JWT token returned." })
  async registerUserEmail(@Body() body: unknown) {
    return this.registerUser(body);
  }

  /** Register user specifically via Social Provider */
  @Post("register/social")
  @HttpCode(200)
  @ApiBody({ type: RegisterSocialRequestDto })
  @ApiOperation({ summary: "Register user via Social Provider (Google, Facebook, Apple)." })
  @ApiResponse({ status: 200, description: "Registration succeeded; JWT token returned." })
  async registerUserSocial(@Body() body: unknown) {
    return this.registerUser(body);
  }

  /** createAuthenticationTokenUsingSocialID(NVerseSocialRequest) — public, no @RequireGate. */
  @Post("authenticate/social")
  @HttpCode(200)
  @ApiBody({ type: SocialLoginRequestDto })
  @ApiOperation({ summary: "Authenticate via a social/Auth0-issued token, issuing a JWT." })
  @ApiResponse({ status: 200, description: "Authentication succeeded; JWT token returned." })
  @ApiResponse({ status: 400, description: "Malformed username/token/provider." })
  @ApiResponse({ status: 401, description: "Invalid Auth0 token or unknown tenant." })
  async authenticateWithSocial(@Body() body: unknown) {
    const { username, auth0Token, provider } = parseSocialLoginRequest(body);

    const isTokenValid = await this.auth0.validateToken(auth0Token, username);
    if (!isTokenValid) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_PROVIDER_TOKEN);
    }

    const decodedPassword = await this.auth0.getUserFromToken(auth0Token);

    const tenant = await this.tenantLookup.findByEmail(username);
    if (!tenant) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);
    }

    const authenticatedTenant: AuthenticatedTenant = {
      id: tenant.id,
      uid: tenant.uid,
      email: tenant.email,
      roles: tenant.roles,
    };
    const token = this.gatekeeper.generateToken(authenticatedTenant);

    void (async () => {
      const hashed = await this.gatekeeper.hashPassword(decodedPassword);
      await this.tenantLookup.updateLoginMetadata(tenant.id, {
        emailVerified: true,
        lastAccessTime: Date.now(),
        provider,
        userPassword: hashed,
      });
    })();

    return keyedResponse("token", token);
  }

  /** getAuthorityToken(NVerseHttpRequestWrapper) — CODE_SUCU, source-verified 1:1. */
  @Get("authority")
  @RequireGate(GateCode.CODE_SUCU)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Resolve the caller's role flags (superUser/customer) from a valid bearer token." })
  @ApiResponse({ status: 200, description: "Authority flags for the authenticated tenant." })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 403, description: "Token is valid but lacks the required role." })
  getAuthorityToken(@CurrentTenant() tenant: AuthenticatedTenant) {
    const authority: Authority = {
      superUser: tenant.roles.includes("ROLE_SUPER_USER"),
      customer: tenant.roles.includes("ROLE_CUSTOMER"),
    };
    return keyedResponse("authority", authority);
  }

  /** validateProvider(NVerseAuthProviderValidationRequest) — CODE_SUCU (authenticated route, not in NON_AUTHENTICATED_URLS). */
  @Post("validate/provider")
  @HttpCode(200)
  @RequireGate(GateCode.CODE_SUCU)
  @ApiBearerAuth()
  @ApiBody({ type: ValidateProviderRequestDto })
  @ApiOperation({ summary: "Check whether a tenant's stored auth provider matches the one supplied." })
  @ApiResponse({ status: 200, description: "Provider validity result." })
  @ApiResponse({ status: 400, description: "Malformed username/provider." })
  @ApiResponse({ status: 401, description: "Missing/invalid bearer token, or unknown tenant." })
  @ApiResponse({ status: 403, description: "Token is valid but lacks the required role." })
  async validateProvider(@Body() body: unknown) {
    const { username, provider } = parseValidateProviderRequest(body);

    const tenant = await this.tenantLookup.findByEmail(username);
    if (!tenant) {
      throw new UnauthorizedException(AuthErrorCode.INVALID_CREDENTIALS);
    }

    const isProviderValid = tenant.provider === provider;

    return keyedResponse("provider", {
      isProviderValid,
      providerOrdinal: isProviderValid ? -1 : AUTH_PROVIDERS.indexOf(tenant.provider),
    });
  }
}
