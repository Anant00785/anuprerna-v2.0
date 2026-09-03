/**
 * apps/api/src/common/auth/roles.guard.ts
 *
 * Shared, app-wide authorization guard.
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

    // NEVER decode an unverified payload as a fallback: verifyToken throws
    // (UnauthorizedException) on a bad signature, expiry or malformation and
    // that must propagate. Dual-accept of legacy Loom tokens, when it lands
    // (docs/features/0001-identity-dual-accept-auth.md), means verifying
    // against a second secret here — never skipping verification.
    const tenant: AuthenticatedTenant = this.gatekeeper.verifyToken(token);
    request.tenant = tenant;

    if (!this.gatekeeper.userHasAppropriateAuthority(tenant, requiredGate)) {
      throw new ForbiddenException("You do not have the required role for this action.");
    }

    return true;
  }
}
