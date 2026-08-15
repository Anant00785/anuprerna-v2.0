// @ts-nocheck
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { NVerseController } from "./controller/nverse.controller.js";
import { NVerseService } from "./service/nverse.service.js";
import { NVerseRepository } from "./repository/nverse.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [NVerseController],
  providers: [NVerseService, NVerseRepository],
  exports: [NVerseService, NVerseRepository],
})
export class NverseModule {}
