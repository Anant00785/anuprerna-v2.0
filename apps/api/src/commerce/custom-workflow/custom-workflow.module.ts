import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ImpactModule } from "../impact/impact.module.js";
import { CustomWorkflowController } from "./controller/custom-workflow.controller.js";
import { CustomWorkflowService } from "./service/custom-workflow.service.js";
import { CustomWorkflowRepository } from "./repository/custom-workflow.repository.js";
import { CustomWorkflowWriteRepository } from "./repository/custom-workflow-write.repository.js";

@Module({
  // ImpactModule supplies CustomOrderImpactService: Loom's addWorkflow and
  // updateWorkflow publish a custom-order impact refresh after a successful write.
  imports: [AuthModule, ImpactModule],
  controllers: [CustomWorkflowController],
  providers: [CustomWorkflowService, CustomWorkflowRepository, CustomWorkflowWriteRepository],
  exports: [CustomWorkflowService, CustomWorkflowRepository],
})
export class CustomWorkflowModule {}
