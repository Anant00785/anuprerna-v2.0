// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { SkillController } from "./controller/skill.controller.js";
import { SkillService } from "./service/skill.service.js";
import { SkillRepository } from "./repository/skill.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [SkillController],
  providers: [SkillService, SkillRepository],
  exports: [SkillService, SkillRepository],
})
export class SkillModule {}
