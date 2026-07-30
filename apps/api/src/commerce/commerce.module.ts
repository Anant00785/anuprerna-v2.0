import { Module } from "@nestjs/common";
import { CartModule } from "./cart/cart.module.js";

@Module({
  imports: [CartModule],
})
export class CommerceModule {}