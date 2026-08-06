/**
 * apps/api/src/commerce/cart/cart.module.ts
 *
 * Wires the Cart feature together.
 *
 * WIRED (real providers, as of this integration pass):
 *  - FABRIC_PREVIEW_PORT  -> FabricPreviewService  (commerce/product/fabric-preview)
 *  - FINISHED_PREVIEW_PORT -> FinishedPreviewService (commerce/product/finished-preview)
 *  - TENANT_LOOKUP_PORT   -> TenantLookupRepository (auth), via AuthModule's export
 *
 *    FabricPreviewService#retrieveEntity / FinishedPreviewService#retrieveEntity take
 *    a `bigint` id (see their own types.ts), while FabricPreviewPort/FinishedPreviewPort
 *    are typed to `number` (see cart.types.ts) — the useFactory bindings below convert
 *    at the boundary (`BigInt(id)`) rather than editing either module's own source.
 *    FabricPreviewPort#retrieveFabricProductByProductId has no same-named method on
 *    FabricPreviewService; it maps 1:1 onto FabricPreviewService#findByProductId
 *    (source-verified as the `findFabricPreviewByProduct` port), so the factory aliases
 *    it rather than assuming a rename.
 *
 *    Neither FabricPreview nor FinishedPreview has its own NestJS module file in the
 *    uploaded workspace (only service/repository/mapper/types), so their Service +
 *    Repository classes are registered directly as CartModule providers below — the
 *    same direct-registration pattern this file already used for CartService/CartRepository.
 *    Both services also accept an optional PRODUCT_PREVIEW_LOOKUP_PORT (for resolving
 *    their joined `product` field); no implementation of that port exists anywhere in
 *    the uploaded workspace, so it is left unbound — @Optional() means Nest injects
 *    undefined rather than throwing, and both services already no-op the enrichment
 *    step when that dependency is absent.
 *
 * STILL DUMMY (no real implementation exists anywhere in the uploaded workspace):
 *  - SIZE_PROFILE_OPTION_PORT
 *  - FINISH_PROFILE_ITEM_PORT
 *  - EMAIL_ENCODER_PORT
 *  Each dummy returns the "nothing found" value its own interface contract allows
 *  (`null` for nullable lookups, `""` for EmailEncoderPort#decode since that contract
 *  returns a non-nullable string) instead of fabricating Profile/Identity behavior.
 *  See TODO.md for exactly what's missing before these can be wired for real.
 *
 * DatabaseModule is @Global() (see database/database.module.ts), so
 * DATABASE_CONNECTION doesn't need to be re-imported here — CartRepository and
 * FabricPreviewRepository/FinishedPreviewRepository all inject it directly.
 */
import { Module } from "@nestjs/common";
import { CartController } from "./controller/cart.controller.js";
import { CartService } from "./service/cart.service.js";
import { CartRepository } from "./repository/cart.repository.js";
import { AuthModule } from "../../auth/auth.module.js";
import { TenantLookupRepository } from "../../auth/repository/tenant-lookup.repository.js";
import { FabricPreviewService } from "../product/product-preview/service/fabric-preview.service.js";
import { FabricPreviewRepository } from "../product/product-preview/repository/fabric-preview.repository.js";
import { FinishedPreviewService } from "../product/product-preview/service/finished-preview.service.js";
import { FinishedPreviewRepository } from "../product/product-preview/repository/finished-preview.repository.js";
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
} from "./types/cart.types.js";

const sizeProfileOptionDummy: SizeProfileOptionPort = {
  retrieveSizeProfileOption: async () => null,
};

const finishProfileItemDummy: FinishProfileItemPort = {
  retrieveEntity: async () => null,
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
    FabricPreviewService,
    FabricPreviewRepository,
    FinishedPreviewService,
    FinishedPreviewRepository,
    {
      provide: FABRIC_PREVIEW_PORT,
      useFactory: (service: FabricPreviewService): FabricPreviewPort => ({
        retrieveEntity: (id: number) => service.retrieveEntity(BigInt(id)),
        retrieveFabricProductByProductId: (productId: number) => service.findByProductId(productId),
      }),
      inject: [FabricPreviewService],
    },
    {
      provide: FINISHED_PREVIEW_PORT,
      useFactory: (service: FinishedPreviewService): FinishedPreviewPort => ({
        retrieveEntity: (id: number) => service.retrieveEntity(BigInt(id)),
      }),
      inject: [FinishedPreviewService],
    },
    { provide: TENANT_LOOKUP_PORT, useExisting: TenantLookupRepository },
    { provide: SIZE_PROFILE_OPTION_PORT, useValue: sizeProfileOptionDummy },
    { provide: FINISH_PROFILE_ITEM_PORT, useValue: finishProfileItemDummy },
    { provide: EMAIL_ENCODER_PORT, useValue: emailEncoderDummy },
  ],
  exports: [CartService],
})
export class CartModule {}
