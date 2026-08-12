import { Module } from "@nestjs/common";
import { ImageController } from "./controller/image.controller.js";
import { ImageService } from "./service/image.service.js";
import { AuthModule } from "../../auth/auth.module.js";

@Module({
  imports: [AuthModule],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}

