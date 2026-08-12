import { Module } from "@nestjs/common";
import { Msg91Controller } from "./msg91.controller.js";
import { Msg91Service } from "./msg91.service.js";

@Module({
  controllers: [Msg91Controller],
  providers: [Msg91Service],
  exports: [Msg91Service],
})
export class Msg91Module {}

