import { Module } from "@nestjs/common";
import { TenantController } from "./controller/tenant.controller.js";
import { TenantService } from "./service/tenant.service.js";
import { TenantRepository } from "./repository/tenant.repository.js";
import { AuthModule } from "../../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [TenantController],
  providers: [TenantService, TenantRepository],
  exports: [TenantService, TenantRepository],
})
export class TenantModule {}
