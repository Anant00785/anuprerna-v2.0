/**
 * apps/api/src/health/health.controller.ts
 *
 * `/health` is source-verified as a real, public route constant —
 * com.bloomscorp.loom.support.RequestMapper.HEALTH, listed in
 * LoomSecurityConfiguration.NON_AUTHENTICATED_URLS — but no health
 * controller was migrated anywhere in the sources reviewed. This is new,
 * minimal code (not a port of existing business logic), added only so the
 * requested "Health" Swagger tag has a real endpoint. No @UseGuards,
 * matching source's exclusion from the authenticated filter chain, and no
 * @ApiBearerAuth since it's not a protected route.
 */
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

@ApiTags("Health")
@Controller()
export class HealthController {
  @Get("/health")
  @ApiOperation({ summary: "Liveness check" })
  @ApiResponse({ status: 200, description: "Service is up and responding." })
  getHealth() {
    return { status: "ok" };
  }
}