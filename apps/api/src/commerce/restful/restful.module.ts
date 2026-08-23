import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { RestfulController } from "./restful.controller.js";
import { RestfulService } from "./restful.service.js";

@Module({
  imports: [AuthModule],
  controllers: [RestfulController],
  providers: [RestfulService],
  exports: [RestfulService],
})
export class RestfulModule {}

