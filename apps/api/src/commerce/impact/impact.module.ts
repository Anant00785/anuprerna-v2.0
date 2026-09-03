import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ImpactController } from "./controller/impact.controller.js";
import { ImpactService } from "./service/impact.service.js";
import { ImpactRepository } from "./repository/impact.repository.js";
import { CustomImpactRepository } from "./repository/custom-impact.repository.js";
import { CustomImpactCalculationService } from "./service/custom-impact-calculation.service.js";
import { CustomOrderImpactService } from "./service/custom-order-impact.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ImpactController],
  providers: [ImpactService, ImpactRepository, CustomImpactRepository, CustomImpactCalculationService, CustomOrderImpactService],
  exports: [ImpactService, ImpactRepository, CustomOrderImpactService],
})
export class ImpactModule {}
