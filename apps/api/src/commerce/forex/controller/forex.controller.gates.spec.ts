/**
 * src/commerce/forex/controller/forex.controller.gates.spec.ts
 *
 * Authorization regression tests for ForexController, checked against loom's
 * Java originals:
 *
 *   forex/controller/ForexController.java
 *     getForexList        -> /get/forex-list        : NO gate (buildList direct)
 *     getForexDataDump    -> /get/data-dump/forex   : CODE_SU (getEntity)
 *   forex/controller/ForexExchangeRateController.java
 *     retrieveLatestForexExchangeRate    -> /get/forex-exchange-rate/latest : NO gate
 *     retrieveForexExchangeRateList      -> /get/forex-exchange-rate-list   : NO gate
 *
 * The three ungated reads are what the UNAUTHENTICATED storefront SSR calls;
 * gating them (as an earlier pass did) 401s every page render.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { ForexController } from "./forex.controller.js";

describeGates(
  "ForexController",
  ForexController as never,
  [
    ["getForexDataDump", GateCode.CODE_SU],
    ["updateExchangeRate", GateCode.CODE_SU],
  ],
  ["getExchangeRates", "getLatestExchangeRate", "getForexList", "getExchangeRateByCode"],
);
