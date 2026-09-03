/**
 * apps/api/src/commerce/product-size-profile/product-size-profile.module.ts
 *
 * Wires the ProductSizeProfile feature together. SizeProfileOptionPort is a
 * cross-module dependency (Profile/SizeProfile) that is out of scope for
 * this migration — see types/product-size-profile.types.ts.
 *
 * DatabaseModule is @Global() (see database/database.module.ts), so
 * DATABASE_CONNECTION doesn't need to be re-imported here —
 * ProductSizeProfileRepository injects it directly, exactly like Cart.
 *
 * SIZE_PROFILE_OPTION_PORT is a real select-by-id over `size_profile_option`
 * (commerce/shared/db-lookup.ts) — it replaces an `async () => null` dummy
 * that made `sizeProfileOption` permanently absent from every retrieved
 * row and silently voided the consumedFabric fallback in
 * retrieveConsumedFabricForImpact.
 *
 * No controller is registered — no RequestMapper.java was found for
 * ProductSizeProfile in the uploaded source, so none is generated here per
 * the migration brief. Add one once the corresponding REST mapping source
 * is available.
 * */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { ProductSizeProfileController } from "../controller/product-size-profile.controller.js";
import { ProductSizeProfileService } from "./service/product-size-profile.service.js";
import { ProductSizeProfileRepository } from "./repository/product-size-profile.repository.js";
import { SIZE_PROFILE_OPTION_PORT, SizeProfileOptionPort } from "./types/product-size-profile.types.js";
import { DATABASE_CONNECTION, type Database } from "../../../database/database.module.js";
import * as schema from "../../../database/schema/schema.js";
import { eq } from "drizzle-orm";

@Module({

  imports: [AuthModule],

  controllers: [ProductSizeProfileController],

  providers: [
    ProductSizeProfileService,
    ProductSizeProfileRepository,
    {
      provide: SIZE_PROFILE_OPTION_PORT,
      useFactory: (db: Database): SizeProfileOptionPort => ({
        // id is a bigserial and consumed_fabric a numeric (string in drizzle);
        // the port's preview shape is numeric, so both are converted here.
        retrieveSizeProfileOption: async (id) => {
          const [row] = await db
            .select()
            .from(schema.sizeProfileOption)
            .where(eq(schema.sizeProfileOption.id, BigInt(id)))
            .limit(1);
          if (!row) return null;
          return { ...row, id: Number(row.id), consumedFabric: Number(row.consumedFabric) };
        },
      }),
      inject: [DATABASE_CONNECTION],
    },
  ],
  exports: [ProductSizeProfileService],
})
export class ProductSizeProfileModule {}
