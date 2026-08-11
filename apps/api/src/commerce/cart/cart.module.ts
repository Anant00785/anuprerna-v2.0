// @ts-nocheck
/**
 * apps/api/src/commerce/cart/cart.module.ts
 *
 * Wires the Cart feature using the LOOM-style controller from controller/.
 * Routes: GET /get/cart-item/list, POST /add/cart-item, PATCH /update/cart-item,
 *         DELETE /delete/cart-item/:cartItemId, DELETE /delete/all-cart-item,
 *         GET /get/table-explorer/data/cart-item, GET /get/tenant/cart-item/list
 */
import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { CartController } from "./controller/cart.controller.js";
import { CartService } from "./service/cart.service.js";
import { CartRepository } from "./repository/cart.repository.js";
import {
  EMAIL_ENCODER_PORT,
  EmailEncoderPort,
  FABRIC_PREVIEW_PORT,
  FabricPreviewPort,
  FINISHED_PREVIEW_PORT,
  FINISH_PROFILE_ITEM_PORT,
  FinishProfileItemPort,
  FinishedPreviewPort,
  SIZE_PROFILE_OPTION_PORT,
  SizeProfileOptionPort,
  TENANT_LOOKUP_PORT,
  TenantLookupPort,
} from "./types/cart.types.js";

// Safe dummy implementations for cross-module ports not yet migrated.
const emailEncoderDummy: EmailEncoderPort = {
  decode: async (cipherText: string) => cipherText,
};

const fabricPreviewDummy: FabricPreviewPort = {
  retrieveEntity: async (id: number) => ({ id } as any),
  retrieveFabricProductByProductId: async (id: number) => ({ id } as any),
};

const finishedPreviewDummy: FinishedPreviewPort = {
  retrieveEntity: async (id: number) => ({ id } as any),
};

const finishProfileItemDummy: FinishProfileItemPort = {
  retrieveEntity: async (id: number) => ({ id, finishProfile: { displayName: "Default Finish" } } as any),
};

const sizeProfileOptionDummy: SizeProfileOptionPort = {
  retrieveSizeProfileOption: async (id: number) => ({ id } as any),
};

const tenantLookupDummy: TenantLookupPort = {
  retrieveUserByUid: async () => null,
};

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [
    CartService,
    CartRepository,
    { provide: EMAIL_ENCODER_PORT, useValue: emailEncoderDummy },
    { provide: FABRIC_PREVIEW_PORT, useValue: fabricPreviewDummy },
    { provide: FINISHED_PREVIEW_PORT, useValue: finishedPreviewDummy },
    { provide: FINISH_PROFILE_ITEM_PORT, useValue: finishProfileItemDummy },
    { provide: SIZE_PROFILE_OPTION_PORT, useValue: sizeProfileOptionDummy },
    { provide: TENANT_LOOKUP_PORT, useValue: tenantLookupDummy },
  ],
  exports: [CartService],
})
export class CartModule {}
