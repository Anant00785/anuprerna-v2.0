import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CustomProductController } from "./controller/custom-product.controller.js";
import { CustomProductService } from "./service/custom-product.service.js";
import { CustomProductRepository } from "./repository/custom-product.repository.js";
import { CustomSizeProfileController } from "./controller/custom-size-profile.controller.js";
import { CustomSizeProfileRepository } from "./repository/custom-size-profile.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [CustomProductController, CustomSizeProfileController],
  providers: [CustomProductService, CustomProductRepository, CustomSizeProfileRepository],
  exports: [CustomProductService, CustomProductRepository, CustomSizeProfileRepository],
})
export class CustomProductModule {}
