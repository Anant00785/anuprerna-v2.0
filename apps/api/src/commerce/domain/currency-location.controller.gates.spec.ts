/**
 * src/commerce/domain/currency-location.controller.gates.spec.ts
 *
 * Authorization regression tests for CurrencyLocationDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { CurrencyLocationDomainController } from "./currency-location.controller.js";

describeGates(
  "CurrencyLocationDomainController",
  CurrencyLocationDomainController as never,
  [
    ["get_get_forex_forexId", GateCode.CODE_SU],
    ["post_add_forex", GateCode.CODE_SU],
    ["patch_update_forex", GateCode.CODE_SU],
    ["delete_delete_forex_forexId", GateCode.CODE_SU],
    ["get_get_table_explorer_data_forex_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_forex_exchange_rate_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_forex_exchange_rate", GateCode.CODE_SU],
    ["get_get_table_explorer_data_forex", GateCode.CODE_SU],
  ],
  // PUBLIC: a duplicate registration of ForexController's /get/forex-list +
  // /get/forex/list. Loom's ForexController.getForexList() calls response.buildList()
  // directly, and the storefront fetches it during SSR with no bearer token.
  ["get_get_forex_list", "get_get_ip_wise_currency"],
);
