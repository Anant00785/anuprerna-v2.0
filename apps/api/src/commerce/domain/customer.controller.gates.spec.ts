/**
 * src/commerce/domain/customer.controller.gates.spec.ts
 *
 * Authorization regression tests for CustomerDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { CustomerDomainController } from "./customer.controller.js";

describeGates(
  "CustomerDomainController",
  CustomerDomainController as never,
  [
    ["get_get_customers", GateCode.CODE_SU],
    ["get_get_loyalty_eligible_customers", GateCode.CODE_SU],
    ["get_get_loyalty_program_customers_metrics", GateCode.CODE_SU],
    ["get_get_customer_loyalty_info", GateCode.CODE_CU],
    ["get_get_data_dump_customer", GateCode.CODE_SU],
    ["get_get_table_explorer_data_customer", GateCode.CODE_SU],
    ["get_get_table_explorer_data_customer_id", GateCode.CODE_SU],
  ],
  [],
);
