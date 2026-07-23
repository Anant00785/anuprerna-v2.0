import { Module } from "@nestjs/common";
import { IdentityModule } from "./identity/identity.module.js";
import { CommerceModule } from "./commerce/commerce.module.js";
import { WorkflowModule } from "./workflow/workflow.module.js";
import { MigrationModule } from "./migration/migration.module.js";
import { ProxyModule } from "./proxy/proxy.module.js";
import { HealthModule } from "./common/health/health.module.js";

// Root wiring. ProxyModule is the strangler catch-all: it forwards not-yet-converted
// reads to legacy Loom and blocks writes. It shrinks to nothing as modules are built.
@Module({
  imports: [
    HealthModule,
    IdentityModule,
    CommerceModule,
    WorkflowModule,
    MigrationModule,
    ProxyModule, // keep LAST — catch-all
  ],
})
export class AppModule {}
