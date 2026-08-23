// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ImpactController } from "./controller/impact.controller.js";
import { ImpactService } from "./service/impact.service.js";
import { ImpactRepository } from "./repository/impact.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [ImpactController],
  providers: [ImpactService, ImpactRepository],
  exports: [ImpactService, ImpactRepository],
})
export class ImpactModule {}
