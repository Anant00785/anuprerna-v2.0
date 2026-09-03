import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ElementFeedbackController } from "./controller/element-feedback.controller.js";
import { StepElementController } from "./controller/step-element.controller.js";
import { SubProcessElementController } from "./controller/subprocess-element.controller.js";
import { WorkflowController } from "./controller/workflow.controller.js";
import { WorkflowService } from "./service/workflow.service.js";
import { WorkflowRepository } from "./repository/workflow.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [ElementFeedbackController, StepElementController, SubProcessElementController, WorkflowController],
  providers: [WorkflowService, WorkflowRepository],
  exports: [WorkflowService, WorkflowRepository],
})
export class WorkflowModule {}
