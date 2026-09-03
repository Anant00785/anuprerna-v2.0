/**
 * apps/api/src/auth/auth.module.ts
 *
 * Wires the Auth feature together: real internal providers
 * (GatekeeperService, TenantLookupRepository, RolesGuard, Auth0ValidationService).
 *
 * AUTH0_VALIDATION_PORT is bound to the real Auth0ValidationService (jose
 * JWKS verification, see service/auth0-validation.service.ts) — NOT to a
 * dummy. A token validator that always answers `false` is an
 * authentication control silently stuck in one position; it throws on
 * missing AUTH0_ISSUER config instead.
 *
 * RolesGuard is provided AND exported here because it's imported directly
 * by other feature modules (e.g. commerce/cart) via
 * `common/auth/roles.guard.ts`'s `RolesGuard` class — any module that uses
 * `@UseGuards(RolesGuard)` must import AuthModule so Nest can resolve
 * RolesGuard's own dependency on GatekeeperService.
 *
 * DatabaseModule is @Global(), so TenantLookupRepository injects
 * DATABASE_CONNECTION directly without this module re-importing it —
 * identical to how CartRepository is wired.
 */
import { Module } from "@nestjs/common";
import { AuthController } from "./controller/auth.controller.js";
import { LoomLegacyAuthController } from "./controller/loom-legacy-auth.controller.js";
import { GatekeeperService } from "./service/gatekeeper.service.js";
import { TenantLookupRepository } from "./repository/tenant-lookup.repository.js";
import { RolesGuard } from "../common/auth/roles.guard.js";
import { Auth0ValidationService } from "./service/auth0-validation.service.js";
import { AUTH0_VALIDATION_PORT } from "./types/auth.types.js";
import { PasswordResetService } from "./service/password-reset.service.js";

@Module({
  controllers: [AuthController, LoomLegacyAuthController],
  providers: [
    GatekeeperService,
    TenantLookupRepository,
    RolesGuard,
    Auth0ValidationService,
    { provide: AUTH0_VALIDATION_PORT, useExisting: Auth0ValidationService },
    PasswordResetService,
  ],
  exports: [GatekeeperService, TenantLookupRepository, RolesGuard],
})
export class AuthModule {}
