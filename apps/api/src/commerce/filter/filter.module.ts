/**
 * apps/api/src/commerce/filter/filter.module.ts
 *
 * Wires the Filter feature using the LOOM-style controller from controller/.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { FilterController } from "./controller/filter.controller.js";
import { FilterService } from "./service/filter.service.js";
import { FilterRepository } from "./repository/filter.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [FilterController],
  providers: [FilterService, FilterRepository],
  exports: [FilterService],
})
export class FilterModule {}
