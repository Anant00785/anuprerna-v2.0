import { Module } from "@nestjs/common";
import { TenantController } from "./controller/tenant.controller.js";
import { CustomerAccountController } from "./controller/customer-account.controller.js";
import { TenantService } from "./service/tenant.service.js";
import { TenantRepository } from "./repository/tenant.repository.js";
import { AuthModule } from "../../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [TenantController, CustomerAccountController],
  providers: [TenantService, TenantRepository],
  exports: [TenantService, TenantRepository],
})
export class TenantModule {}
