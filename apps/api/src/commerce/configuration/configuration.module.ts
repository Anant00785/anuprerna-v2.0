import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ConfigurationController } from "./configuration.controller.js";
import { ConfigurationService } from "./configuration.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ConfigurationController],
  providers: [ConfigurationService],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}
