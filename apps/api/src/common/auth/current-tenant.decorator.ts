/**
 * apps/api/src/common/auth/current-tenant.decorator.ts
 *
 * Pulls the AuthenticatedTenant RolesGuard attaches to the request.
 * Lives alongside roles.guard.ts under common/ for the same reason: other
 * feature modules (e.g. commerce/cart) import it directly via
 * `import { CurrentTenant } from "../../../common/auth/current-tenant.decorator"`.
 */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedTenant } from "../../auth/types/auth.types.js";

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedTenant => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
