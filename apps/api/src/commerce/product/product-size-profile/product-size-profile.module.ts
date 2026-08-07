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
 * The port below is bound to a safe dummy implementation rather than left
 * unbound or throwing, matching cart.module.ts's approach: it returns
 * 
ull` (the "nothing found" value SizeProfileOptionPort's contract
 * allows) instead of fabricating Profile/SizeProfile behavior. This keeps
 * the module bootable and every operation that doesn't depend on the
 * SizeProfileOption relation (create/read/update/delete a size-profile row
 * by id, paginate, delete-by-product, delete-by-size-option) working end to
 * end; a lookup that legitimately needs the real size option (the
 * `sizeProfileOption` field on a retrieved view, or the consumedFabric
 * fallback in retrieveConsumedFabricForImpact) degrades to 
ull` rather
 * than a 500.
 *
 * No controller is registered — no RequestMapper.java was found for
 * ProductSizeProfile in the uploaded source, so none is generated here per
 * the migration brief. Add one once the corresponding REST mapping source
 * is available.
 *
 * Replace the `useValue` below with a real provider once the
 * Profile/SizeProfile module is migrated.
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../../auth/auth.module.js";
import { ProductSizeProfileController } from "../controller/product-size-profile.controller.js";
import { ProductSizeProfileService } from "./service/product-size-profile.service.js";
import { ProductSizeProfileRepository } from "./repository/product-size-profile.repository.js";
import { SIZE_PROFILE_OPTION_PORT, SizeProfileOptionPort } from "./types/product-size-profile.types.js";

const sizeProfileOptionDummy: SizeProfileOptionPort = {
  retrieveSizeProfileOption: async () => null,
};

@Module({
  imports: [AuthModule],
  controllers: [ProductSizeProfileController],
  providers: [
    ProductSizeProfileService,
    ProductSizeProfileRepository,
    { provide: SIZE_PROFILE_OPTION_PORT, useValue: sizeProfileOptionDummy },
  ],
  exports: [ProductSizeProfileService],
})
export class ProductSizeProfileModule {}
