// @ts-nocheck
/**
 * apps/api/src/product/special-status/special-status.module.ts
 *
 * Wires the SpecialStatus feature together. No controller is registered —
 * per this task's explicit scope, and because RequestMapper.java (route
 * path constants: GET_SPECIAL_STATUS_LIST, ADD_SPECIAL_STATUS,
 * UPDATE_SPECIAL_STATUS, DELETE_SPECIAL_STATUS,
 * GET_TABLE_EXPLORER_DATA_SPECIAL_STATUS,
 * GET_TABLE_EXPLORER_DATA_SPECIAL_STATUS_BY_ID) is not available in this
 * migration — see SpecialStatusController.java for the full route list
 * this module will eventually serve.
 *
 * DatabaseModule is @Global() (see database/database.module.ts), so
 * DATABASE_CONNECTION doesn't need to be re-imported here —
 * SpecialStatusRepository injects it directly, exactly like
 * product/sku_group/SkuGroup.module.ts.
 *
 * Like SkuGroup, SpecialStatus has no cross-module ports to wire — source
 * SpecialStatusDaoController has no dependency on Product/Profile/Tenant
 * lookups, so there are no dummy providers here. This module is NOT
 * imported into ProductModule or CommerceModule by this change — neither
 * aggregator exists yet (see TODO.md); wiring this module in is left for
 * whoever creates that aggregator.
 */
import { Module } from "@nestjs/common";
import { SpecialStatusService } from "./service/special-status.service.js";
import { SpecialStatusRepository } from "./repository/special-status.repository.js";

@Module({
  providers: [SpecialStatusService, SpecialStatusRepository],
  exports: [SpecialStatusService],
})
export class SpecialStatusModule {}
