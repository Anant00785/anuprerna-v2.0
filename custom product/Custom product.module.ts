/**
 * apps/api/src/product/custom-product/custom-product.module.ts
 *
 * Wires the CustomProduct feature together. No controller is imported/
 * registered by this module file itself — custom-product.controller.ts
 * already exists (generated separately) and is expected to be added to
 * this module's `controllers` array by whoever owns that wiring step next;
 * out of scope for "generate ONLY custom-product.module.ts".
 *
 * REUSE: unlike FabricProductModule (which imports ProductCoreModule) but
 * like FinishedProductModule's ProductPort, CustomProduct has no nested
 * Product relation at all — see custom-product.types.ts's own header:
 * "CustomProduct extends BehemothORM directly, with its own name/sku/
 * price/etc. columns, no @ManyToOne to Product anywhere in the class." So
 * there's no ProductCoreModule import here; CustomProductRepository/
 * CustomProductService are fully self-contained aside from the two ports
 * below.
 *
 * CUSTOM_ORDER_ITEM_PORT / SYNC_ERROR_LOGGER_PORT are cross-module
 * dependencies (Order, and LoomCronManager/LoomLogBook infra) — see
 * types/custom-product.types.ts for why each is a port: the Order module
 * isn't migrated yet, and the log-task scheduler is external infra not
 * present in this repository at all (same treatment ZohoAdapterPort gets
 * in FabricProductModule/FinishedProductModule).
 *
 * Both ports are bound to safe dummy implementations rather than left
 * unbound or throwing, exactly like FabricProductModule / FinishedProductModule
 * / cart.module.ts: each dummy returns the "nothing succeeded"/no-op value
 * its own interface contract allows. This keeps the module bootable end to
 * end — updateCustomProduct's order-item sync degrades to the same
 * UPDATE_FAILURE outcome (and therefore the same CustomProductOrderItemSyncError
 * throw) the service already handles for a real sync failure, rather than
 * a 500 from a missing provider.
 *
 * DatabaseModule is @Global() (see database/database.module.ts), so
 * CustomProductRepository injects DATABASE_CONNECTION directly without
 * this module re-importing it — same as every other feature module in
 * this migration.
 *
 * Replace each `useValue` below with a real provider as the Order module
 * and the Zoho/cron logging infra get migrated.
 */
import { Module } from "@nestjs/common";
import { CustomProductService } from "./service/custom-product.service.js";
import { CustomProductRepository } from "./repository/custom-product.repository.js";
import {
  CUSTOM_ORDER_ITEM_PORT,
  CustomOrderItemPort,
  SYNC_ERROR_LOGGER_PORT,
  SyncErrorLoggerPort,
} from "./types/custom-product.types.js";

const customOrderItemDummy: CustomOrderItemPort = {
  updateCustomProductReference: async () => -5, // ActionCode.UPDATE_FAILURE
};

const syncErrorLoggerDummy: SyncErrorLoggerPort = {
  logCustomProductOrderItemSyncError: async () => {},
};

@Module({
  providers: [
    CustomProductService,
    CustomProductRepository,
    { provide: CUSTOM_ORDER_ITEM_PORT, useValue: customOrderItemDummy },
    { provide: SYNC_ERROR_LOGGER_PORT, useValue: syncErrorLoggerDummy },
  ],
  exports: [CustomProductService, CustomProductRepository],
})
export class CustomProductModule {}