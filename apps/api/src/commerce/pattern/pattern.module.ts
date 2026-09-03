/**
 * apps/api/src/commerce/pattern/pattern.module.ts
 *
 * Wires the Pattern feature using the LOOM-style controller from controller/.
 * Routes: GET /get/pattern-list, POST /add/pattern, PATCH /update/pattern,
 *         DELETE /delete/pattern/:id
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { PatternController } from "./controller/pattern.controller.js";
import { PatternService } from "./service/pattern.service.js";
import { PatternRepository } from "./repository/pattern.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [PatternController],
  providers: [PatternService, PatternRepository],
  exports: [PatternService],
})
export class PatternModule {}
