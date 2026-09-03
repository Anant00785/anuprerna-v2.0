/**
 * Gate spec for the /checkout/* family.
 *
 * EVERY route here is INTENTIONALLY public to the RolesGuard: a guest has no
 * token, so a @RequireGate on any of these kills guest checkout outright.
 * "Public" is not "trusting" — identity and authorisation are enforced
 * in-handler (verified bearer token, the BFF-injected guest identity, the
 * hashed per-order guest token, the unguessable order-status token) and those
 * checks are pinned by checkout.e2e.spec.ts. This spec pins the OTHER side of
 * the boundary: that the guard keeps these reachable without a token, so a
 * future gate cannot silently 401 every guest.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { CheckoutController } from "./checkout.controller.js";

describeGates(
  "CheckoutController",
  CheckoutController as never,
  [],
  [
    "paymentMode",
    "shipmentList",
    "createOrder",
    "createPaymentSession",
    "paymentCallback",
    "orderStatus",
    "sandboxGateway",
  ],
);
