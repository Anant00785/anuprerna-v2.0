/**
 * apps/api/src/commerce/color/color.module.ts
 *
 * Wires the Color feature using the LOOM-style controller from controller/.
 * Routes: GET /get/color-list
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { ColorLoomController } from "./controller/color.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [ColorLoomController],
})
export class ColorModule {}
