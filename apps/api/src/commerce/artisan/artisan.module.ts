import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ArtisanController } from "./artisan.controller.js";
import { ArtisanService } from "./artisan.service.js";

@Module({
  imports: [AuthModule],
  controllers: [ArtisanController],
  providers: [ArtisanService],
  exports: [ArtisanService],
})
export class ArtisanModule {}
