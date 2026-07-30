// Minimal dummy — satisfies imports for commerce/cart. No business logic:
// pulls whatever is already on the request as `tenant`.
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedTenant } from "./roles.guard.js";

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedTenant => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenant;
  },
);
