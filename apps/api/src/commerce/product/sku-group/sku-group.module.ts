/**
 * apps/api/src/product/sku_group/SkuGroup.module.ts
 *
 * Wires the SkuGroup feature together. No controller is registered yet —
 * RequestMapper.java (route path constants: GET_SKU_GROUP_LIST,
 * ADD_SKU_GROUP, UPDATE_SKU_GROUP, DELETE_SKU_GROUP,
 * GET_TABLE_EXPLORER_DATA_SKU_GROUP, GET_TABLE_EXPLORER_DATA_SKU_GROUP_BY_ID)
 * is not yet available in this migration, per the current checkpoint scope
 * — see SkuGroupController.java for the full route list this module will
 * eventually serve.
 *
 * DatabaseModule is @Global() (see database/database.module.ts), so
 * DATABASE_CONNECTION doesn't need to be re-imported here — SkuGroupRepository
 * injects it directly, exactly like commerce/cart/cart.module.ts.
 *
 * Unlike Cart, SkuGroup has no cross-module ports to wire — source
 * SkuGroupDaoController has no dependency on Product/Profile/Tenant
 * lookups, so there are no dummy providers here.
 */
import { Module } from "@nestjs/common";
import { SkuGroupService } from "./service/sku-group.service.js";
import { SkuGroupRepository } from "./repository/sku-group.repository.js";

@Module({
  providers: [SkuGroupService, SkuGroupRepository],
  exports: [SkuGroupService],
})
export class SkuGroupModule {}
// @ts-nocheck
