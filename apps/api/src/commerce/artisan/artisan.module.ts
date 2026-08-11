import { Module } from "@nestjs/common";
import { ArtisanController } from "./artisan.controller.js";
import { ArtisanService } from "./artisan.service.js";

@Module({
  controllers: [ArtisanController],
  providers: [ArtisanService],
  exports: [ArtisanService],
})
export class ArtisanModule {}
