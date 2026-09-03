import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { NVerseController } from "./controller/nverse.controller.js";
import { NVerseService } from "./service/nverse.service.js";
import { NVerseRepository } from "./repository/nverse.repository.js";
import { Msg91OtpService } from "./service/msg91-otp.service.js";

// AuthModule exports GatekeeperService (JWT issuance + bcrypt) and
// TenantLookupRepository (roles for the token claim); NVerseService needs both.
@Module({
  imports: [AuthModule],
  controllers: [NVerseController],
  providers: [NVerseService, NVerseRepository, Msg91OtpService],
  exports: [NVerseService, NVerseRepository],
})
export class NverseModule {}
