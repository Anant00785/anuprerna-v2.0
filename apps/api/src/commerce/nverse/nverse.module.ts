import { Module } from "@nestjs/common";
import { NVerseController } from "./nverse.controller.js";
import { NVerseService } from "./nverse.service.js";

@Module({
  controllers: [NVerseController],
  providers: [NVerseService],
  exports: [NVerseService],
})
export class NVerseModule {}

