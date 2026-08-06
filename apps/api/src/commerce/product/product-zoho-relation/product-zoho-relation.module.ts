/**
 * apps/api/src/commerce/product-zoho-relation/product-zoho-relation.module.ts
 *
 * Wires the ProductZohoRelation feature together. No cross-module ports are
 * bound here — unlike Cart / ProductSizeProfile, this domain has no
 * external dependency that's out of scope for this migration (see
 * types/product-zoho-relation.types.ts's "NO MISSING MODULE DEPENDENCY"
 * note); the migration brief's "safe dummy ports for any missing external
 * dependencies" instruction is satisfied vacuously — there are none to
 * stub.
 *
 * DatabaseModule is @Global() (see database/database.module.ts), so
 * DATABASE_CONNECTION doesn't need to be re-imported here —
 * ProductZohoRelationRepository injects it directly, exactly like Cart and
 * ProductSizeProfile.
 *
 * No controller is registered in this pass, per the migration brief.
 */
import { Module } from "@nestjs/common";
import { ProductZohoRelationService } from "./service/product-zoho-relation.service.js";
import { ProductZohoRelationRepository } from "./repository/product-zoho-relation.repository.js";

@Module({
  providers: [ProductZohoRelationService, ProductZohoRelationRepository],
  exports: [ProductZohoRelationService],
})
export class ProductZohoRelationModule {}