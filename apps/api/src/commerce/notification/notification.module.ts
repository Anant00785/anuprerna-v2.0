// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { NotificationController } from "./controller/notification.controller.js";
import { EmailTemplateService } from "./service/email-template.service.js";
import { NotificationService } from "./service/notification.service.js";
import { NotificationRepository } from "./repository/notification.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
  providers: [EmailTemplateService, NotificationService, NotificationRepository],
  exports: [EmailTemplateService, NotificationService, NotificationRepository],
})
export class NotificationModule {}
