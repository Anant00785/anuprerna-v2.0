/**
 * src/commerce/payment/controller/payment.controller.gates.spec.ts
 *
 * Authorization regression tests for PaymentController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { PaymentController } from "./payment.controller.js";

describeGates(
  "PaymentController",
  PaymentController as never,
  [
    ["createPaymentSession", GateCode.CODE_CU],
    ["createStripePaymentSession", GateCode.CODE_CU],
    ["postTransactionSuccess", GateCode.CODE_CU],
    ["patchTransactionSuccess", GateCode.CODE_CU],
    ["postTransactionFailure", GateCode.CODE_CU],
    ["patchTransactionFailure", GateCode.CODE_CU],
    ["postPaymentTransaction", GateCode.CODE_SU],
    ["patchPaymentTransaction", GateCode.CODE_SU],
    ["getRazorpayTransactionData", GateCode.CODE_SU],
    ["getRazorpayTransactionById", GateCode.CODE_SU],
    ["getStripeTransactionData", GateCode.CODE_SU],
    ["getStripeTransactionById", GateCode.CODE_SU],
  ],
  ["checkoutStripeWebhook"],
);
