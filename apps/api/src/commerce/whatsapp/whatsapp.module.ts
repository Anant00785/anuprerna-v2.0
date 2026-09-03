import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ConfigModule } from "@nestjs/config";
import { TransmissionModule } from "../transmission/transmission.module.js";
import { WhatsappController } from "./controller/whatsapp.controller.js";
import { WhatsappService } from "./service/whatsapp.service.js";
import { WhatsappRepository } from "./repository/whatsapp.repository.js";
import { WhatsappDeliveryStatusPollingService } from "./service/whatsapp-delivery-status-polling.service.js";

@Module({
  imports: [AuthModule, TransmissionModule, ConfigModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappRepository, WhatsappDeliveryStatusPollingService],
  exports: [WhatsappService, WhatsappRepository, WhatsappDeliveryStatusPollingService],
})
export class WhatsappModule {}
