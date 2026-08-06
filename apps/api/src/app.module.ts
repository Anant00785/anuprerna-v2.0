/**
 * apps/api/src/app.module.ts
 *
 * Root module. Did not exist in the uploaded sources — assembled here so
 * main.ts has something to bootstrap. DatabaseModule is @Global() (see
 * database/database.module.ts) but must still be imported once at the
 * root for its providers to be registered; AuthModule/CartModule then
 * pick up DATABASE_CONNECTION without re-importing it.
 */
import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CommerceModule } from "./commerce/commerce.module.js";
import { HealthController } from "./health/health.controller.js";

@Module({
  imports: [DatabaseModule, AuthModule, CommerceModule],
  controllers: [HealthController],
})
export class AppModule {}