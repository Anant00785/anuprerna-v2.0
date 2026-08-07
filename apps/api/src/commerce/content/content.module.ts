import { Module } from "@nestjs/common";
import { BlogModule } from "./blog/blog.module.js";
import { StoryModule } from "./story/story.module.js";

@Module({
  imports: [BlogModule, StoryModule],
  controllers: [],
  providers: [],
  exports: [BlogModule, StoryModule],
})
export class ContentModule {}
