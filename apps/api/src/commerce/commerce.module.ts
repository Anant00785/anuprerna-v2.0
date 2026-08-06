import { Module } from "@nestjs/common";
import { CartModule } from "./cart/cart.module.js";
import { ProductModule } from "./product/product.module.js";

@Module({
  imports: [
    CartModule,
    ProductModule,
  ],
})
export class CommerceModule {}