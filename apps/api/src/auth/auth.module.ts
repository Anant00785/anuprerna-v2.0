/**
 * apps/api/src/auth/auth.module.ts
 *
 * Wires the Auth feature together: real internal providers
 * (GatekeeperService, TenantLookupRepository, RolesGuard), and the
 * out-of-scope external dependency (Auth0's JWKS validation) bound to a
 * safe dummy `useValue` rather than left unbound — same pattern
 * commerce/cart/cart.module.ts uses for its own out-of-scope ports.
 *
 * AUTH0_VALIDATION_PORT dummy: `validateToken` returns false (source-safe
 * "not found"/"invalid" default — never fabricates a passing validation),
 * `getUserFromToken` returns "" (non-nullable string contract, empty-string
 * analogue of null). Social login will correctly reject every attempt
 * until a real com.auth0-equivalent JWKS client is wired in here.
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
import { AUTH0_VALIDATION_PORT, Auth0ValidationPort } from "./types/auth.types.js";

const auth0ValidationDummy: Auth0ValidationPort = {
  validateToken: async () => false,
  getUserFromToken: async () => "",
};

@Module({
  controllers: [AuthController, LoomLegacyAuthController],
  providers: [
    GatekeeperService,
    TenantLookupRepository,
    RolesGuard,
    { provide: AUTH0_VALIDATION_PORT, useValue: auth0ValidationDummy },
  ],
  exports: [GatekeeperService, TenantLookupRepository, RolesGuard],
})
export class AuthModule {}
