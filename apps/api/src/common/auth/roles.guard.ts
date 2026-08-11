/**
 * apps/api/src/common/auth/roles.guard.ts
 *
 * Shared, app-wide authorization guard — lives under common/ (rather than
 * inside apps/api/src/auth/) because other feature modules (e.g.
 * commerce/cart) depend on it directly via
 * `import { AuthenticatedTenant, GateCode, RequireGate, RolesGuard } from
 * "../../../common/auth/roles.guard"`. It in turn depends on the Auth
 * feature's GatekeeperService and shared types — any module using
 * @UseGuards(RolesGuard) must import AuthModule (or otherwise make
 * GatekeeperService resolvable) so Nest can construct this guard.
 *
 * A Nest-idiomatic port of LoomSecurityConfiguration's filter chain
 * (NVerseRequestFilter + NVerseAuthenticationEntryPoint), combined with
 * LoomGatekeeper's per-route authority check that source performs via
 * CRUDController#getEntity/etc.'s gatekeeper argument.
 *
 * PUBLIC ROUTES: mirrors LoomSecurityConfiguration.NON_AUTHENTICATED_URLS
 * (ROOT_URL, EMAIL_AUTHENTICATION_URL, SOCIAL_AUTHENTICATION_URL, HEALTH).
 * Rather than an ant-matcher allow-list, a route here is public simply by
 * NOT carrying @RequireGate — auth.controller.ts's login endpoints
 * deliberately omit it, exactly the routes source excludes from its
 * security filter chain.
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GatekeeperService } from "../../auth/service/gatekeeper.service.js";
import { AuthenticatedTenant, GateCode } from "../../auth/types/auth.types.js";

// Re-exported so existing/other-module call sites (e.g.
// commerce/cart/controller/cart.controller.ts) that import
// `{ AuthenticatedTenant, GateCode, RequireGate, RolesGuard }` from this
// exact path keep working unchanged. Split into a value re-export
// (GateCode is a real enum with a runtime representation) and a
// type-only re-export (AuthenticatedTenant is an interface) — required
// under `isolatedModules`, which Nest's SWC builder enables by default.
export { GateCode };
export type { AuthenticatedTenant };

export const GATE_CODE_KEY = "gateCode";
export const RequireGate = (code: GateCode) => SetMetadata(GATE_CODE_KEY, code);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly gatekeeper: GatekeeperService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredGate = this.reflector.getAllAndOverride<GateCode | undefined>(GATE_CODE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @RequireGate -> public route (mirrors NON_AUTHENTICATED_URLS).
    if (requiredGate === undefined) return true;

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (!header) {
      throw new UnauthorizedException("Missing Authorization header.");
    }

    let token = header.trim();
    while (token.toLowerCase().startsWith("bearer ")) {
      token = token.slice(7).trim();
    }

    if (!token) {
      throw new UnauthorizedException("Missing or malformed Authorization token.");
    }

    const tenant: AuthenticatedTenant = this.gatekeeper.verifyToken(token);
    request.tenant = tenant;

    if (!this.gatekeeper.userHasAppropriateAuthority(tenant, requiredGate)) {
      throw new ForbiddenException("You do not have the required role for this action.");
    }

    return true;
  }
}
