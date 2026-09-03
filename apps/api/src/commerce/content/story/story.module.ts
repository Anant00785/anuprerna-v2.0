import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { StoryController } from "./controller/story.controller.js";
import { StoryService } from "./service/story.service.js";
import { StoryRepository } from "./repository/story.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [StoryController],
  providers: [StoryService, StoryRepository],
  exports: [StoryService],
})
export class StoryModule {}
