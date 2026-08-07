import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { BlogController } from "./controller/blog.controller.js";
import { BlogService } from "./service/blog.service.js";
import { BlogRepository } from "./repository/blog.repository.js";

@Module({
  imports: [AuthModule],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository],
  exports: [BlogService],
})
export class BlogModule {}
