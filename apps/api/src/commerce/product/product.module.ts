import { Module } from "@nestjs/common";
import { ProductController } from "./controller/product.controller.js";
import { AuthModule } from "../../auth/auth.module.js";
import { ProductCoreModule } from "./product/product.module.js";

@Module({
  imports: [AuthModule, ProductCoreModule],
  controllers: [ProductController],
})
export class ProductModule {}
