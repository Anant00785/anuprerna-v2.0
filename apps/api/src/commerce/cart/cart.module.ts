/**
 * apps/api/src/commerce/cart/cart.module.ts
 *
 * Wires the Cart feature together. FabricPreviewPort / FinishedPreviewPort /
 * SizeProfileOptionPort / FinishProfileItemPort / TenantLookupPort /
 * EmailEncoderPort are cross-module dependencies (Product, Profile, Tenant)
 * that are out of scope for this migration — see types/cart.types.ts.
 *
 * DatabaseModule is @Global() (see database/database.module.ts), so
 * DATABASE_CONNECTION doesn't need to be re-imported here — CartRepository
 * injects it directly, exactly like the rest of the app is wired.
 *
 * The six ports below are bound to safe dummy implementations rather than
 * left unbound or throwing. Each dummy returns the "nothing found" value
 * its own interface contract allows (`null` for every nullable lookup,
 * `""` for EmailEncoderPort#decode since that contract returns a
 * non-nullable string) instead of fabricating Product/Profile/Identity
 * behavior. This keeps the module bootable and every Cart endpoint that
 * doesn't depend on those modules (create/read/update/delete a plain cart
 * item, list a cart, etc.) working end to end; a lookup that legitimately
 * needs a real preview/tenant (e.g. adding a cart item that references a
 * fabricProductId) degrades to the same "not found" outcome the code
 * already handles, rather than a 500.
 *
 * Replace each `useValue` below with a real provider as Product, Profile,
 * and Identity get migrated.
 */
import { AuthModule } from "../../auth/auth.module.js";
import { Module } from "@nestjs/common";
import { CartController } from "./controller/cart.controller.js";
import { CartService } from "./service/cart.service.js";
import { CartRepository } from "./repository/cart.repository.js";
import {
  EMAIL_ENCODER_PORT,
  EmailEncoderPort,
  FABRIC_PREVIEW_PORT,
  FabricPreviewPort,
  FINISHED_PREVIEW_PORT,
  FinishedPreviewPort,
  FINISH_PROFILE_ITEM_PORT,
  FinishProfileItemPort,
  SIZE_PROFILE_OPTION_PORT,
  SizeProfileOptionPort,
  TENANT_LOOKUP_PORT,
  TenantLookupPort,
} from "./types/cart.types.js";

const fabricPreviewDummy: FabricPreviewPort = {
  retrieveEntity: async () => null,
  retrieveFabricProductByProductId: async () => null,
};

const finishedPreviewDummy: FinishedPreviewPort = {
  retrieveEntity: async () => null,
};

const sizeProfileOptionDummy: SizeProfileOptionPort = {
  retrieveSizeProfileOption: async () => null,
};

const finishProfileItemDummy: FinishProfileItemPort = {
  retrieveEntity: async () => null,
};

const tenantLookupDummy: TenantLookupPort = {
  retrieveUserByUid: async () => null,
};

// decode()'s contract is Promise<string> — not nullable — so its safe
// dummy is an empty string, the string-typed analogue of null/[].
const emailEncoderDummy: EmailEncoderPort = {
  decode: async () => "",
};

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [
    CartService,
    CartRepository,
    { provide: FABRIC_PREVIEW_PORT, useValue: fabricPreviewDummy },
    { provide: FINISHED_PREVIEW_PORT, useValue: finishedPreviewDummy },
    { provide: SIZE_PROFILE_OPTION_PORT, useValue: sizeProfileOptionDummy },
    { provide: FINISH_PROFILE_ITEM_PORT, useValue: finishProfileItemDummy },
    { provide: TENANT_LOOKUP_PORT, useValue: tenantLookupDummy },
    { provide: EMAIL_ENCODER_PORT, useValue: emailEncoderDummy },
  ],
  exports: [CartService],
})
export class CartModule {}
