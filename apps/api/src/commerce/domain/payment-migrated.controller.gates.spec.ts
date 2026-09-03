/**
 * src/commerce/domain/payment-migrated.controller.gates.spec.ts
 *
 * Authorization regression tests for PaymentMigratedDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { PaymentMigratedDomainController } from "./payment-migrated.controller.js";

describeGates(
  "PaymentMigratedDomainController",
  PaymentMigratedDomainController as never,
  [
    ["post_add_artisan_payment_calculate_workflowId", GateCode.CODE_SU],
    ["get_get_artisan_payment_artisan_artisanId", GateCode.CODE_SU],
    ["get_get_artisan_payment_artisan_artisanId_summary", GateCode.CODE_SU],
    ["get_get_artisan_payment", GateCode.CODE_AR],
    ["get_get_artisan_payment_summary", GateCode.CODE_AR],
    ["get_get_artisan_payments", GateCode.CODE_SU],
    ["patch_update_artisan_payment_record", GateCode.CODE_SU],
    ["patch_update_artisan_payment_approve", GateCode.CODE_SU],
    ["delete_delete_artisan_payment_record_recordId", GateCode.CODE_SU],
    ["get_get_data_dump_transaction", GateCode.CODE_SU],
  ],
  [],
);
