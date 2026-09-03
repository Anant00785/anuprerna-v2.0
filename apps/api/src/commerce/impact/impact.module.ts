import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ImpactController } from "./controller/impact.controller.js";
// Second, separately-named-but-identically-classed controller pair serving
// /get/impact and /create/impact (both @RequireGate(CODE_SU)). Aliased because
// the class names collide with controller/ + service/ above.
import { ImpactController as ImpactRecordController } from "./impact.controller.js";
import { ImpactService as ImpactRecordService } from "./impact.service.js";
import { ImpactService } from "./service/impact.service.js";
import { ImpactRepository } from "./repository/impact.repository.js";
import { CustomImpactRepository } from "./repository/custom-impact.repository.js";
import { CustomImpactCalculationService } from "./service/custom-impact-calculation.service.js";
import { CustomOrderImpactService } from "./service/custom-order-impact.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ImpactController, ImpactRecordController],
  providers: [ImpactService, ImpactRecordService, ImpactRepository, CustomImpactRepository, CustomImpactCalculationService, CustomOrderImpactService],
  exports: [ImpactService, ImpactRepository, CustomOrderImpactService],
})
export class ImpactModule {}
