// @ts-nocheck
/**
 * apps/api/src/commerce/material/material.module.ts
 *
 * Wires the Material feature using the LOOM-style controller from controller/.
 * Routes: GET /get/material-list, POST /add/material, PATCH /update/material,
 *         DELETE /delete/material/:id
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { MaterialController } from "./controller/material.controller.js";
import { MaterialService } from "./service/material.service.js";
import { MaterialRepository } from "./repository/material.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [MaterialController],
  providers: [MaterialService, MaterialRepository],
  exports: [MaterialService],
})
export class MaterialModule {}
