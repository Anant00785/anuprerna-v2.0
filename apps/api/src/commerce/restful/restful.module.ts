import { Module } from "@nestjs/common";
import { RestfulController } from "./restful.controller.js";
import { RestfulService } from "./restful.service.js";

@Module({
  controllers: [RestfulController],
  providers: [RestfulService],
  exports: [RestfulService],
})
export class RestfulModule {}

