// @ts-nocheck
/**
 * apps/api/src/commerce/content/content.module.ts
 *
 * Imports StoryModule and BlogModule which register LOOM StoryController and BlogController.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { StoryModule } from "./story/story.module.js";
import { BlogModule } from "./blog/blog.module.js";

@Module({
  imports: [AuthModule, StoryModule, BlogModule],
  exports: [StoryModule, BlogModule],
})
export class ContentModule {}
