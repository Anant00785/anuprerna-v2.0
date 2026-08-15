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

    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;

    if (header) {
      let token = header.trim();
      while (token.toLowerCase().startsWith("bearer ")) {
        token = token.slice(7).trim();
      }
      if (token) {
        try {
          const tenant: AuthenticatedTenant = this.gatekeeper.verifyToken(token);
          request.tenant = tenant;
        } catch {
          // If a gate is required, it will throw below
        }
      }
    }

    // No @RequireGate -> public route (mirrors NON_AUTHENTICATED_URLS).
    if (requiredGate === undefined) return true;

    if (!request.tenant) {
      throw new UnauthorizedException("Missing or invalid Authorization token.");
    }

    if (!this.gatekeeper.userHasAppropriateAuthority(request.tenant, requiredGate)) {
      throw new ForbiddenException("You do not have the required role for this action.");
    }

    return true;
  }
}
