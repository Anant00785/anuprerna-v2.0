import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { Msg91Controller } from "./msg91.controller.js";
import { Msg91Service } from "./msg91.service.js";

@Module({
  imports: [AuthModule],
  controllers: [Msg91Controller],
  providers: [Msg91Service],
  exports: [Msg91Service],
})
export class Msg91Module {}

