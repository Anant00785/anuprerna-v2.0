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
//
// EMAIL_ENCODER_PORT stays a dummy DELIBERATELY — investigated, not
// forgotten. Legacy emails are encrypted with AES/ECB/PKCS5Padding (128-bit
// key, deterministic by design so identical plaintext maps to the same DB
// lookup key), via `NVerseEmailEncoder`/`NVerseAES` wired in
// loom's `NVerseLaunchSequence2.java`:
//   emailEncoder(@Value("${nverse.aes.key}") String encoderKey)
//     => new NVerseEmailEncoder(encoderKey, emailValidator, NVerseAES.SHA512)
// i.e. the AES key is derived from the `nverse.aes.key` passphrase via
// SHA-512, truncated to 128 bits. HOWEVER: `NVerseAES.java` itself lives in
// an external "bmx-nverse" library not present in this checkout, so the
// exact byte-level truncation/derivation from the 64-byte SHA-512 digest
// down to a 16-byte AES key (which bytes, what order) is NOT verifiable
// from source — only described in prose in loom's documentation/. Getting
// that one detail wrong produces a plausible-looking but WRONG key with no
// error at runtime — silently garbled decode, not a thrown exception. Per
// this task's explicit instruction not to guess at unverified crypto, this
// port is left as a pass-through dummy rather than implementing a guess.
//
// Also note: the config schema's EMAIL_ENCRYPTION_KEY is currently mapped
// from `loom.config.table-explorer.decrypt-email-fingerprint` — that
// property does not exist anywhere in the loom source. What that name
// actually refers to (`LoomTenantDAOController.DECRYPT_EMAIL_FINGERPRINT`,
// `LoomTenantDAOController.java:60`) is an unrelated hardcoded
// shared-secret string that gates *whether* the table-explorer endpoint is
// allowed to call decode() at all, not the AES key. The real Spring
// property for the AES key is `nverse.aes.key`. Flagging for whoever maps
// EMAIL_ENCRYPTION_KEY next (out of scope here: cart.module.ts doesn't own
// the config schema).
//
// To finish this port: obtain `NVerseAES.java` source (or an
// encrypted-email/plaintext-email pair from a legacy account) to confirm
// the exact key derivation, then implement with `node:crypto`
// (`createDecipheriv("aes-128-ecb", key, null)`) and round-trip-test with a
// fixture key before wiring it in for real.
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
