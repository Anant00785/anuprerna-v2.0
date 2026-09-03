/**
 * src/commerce/address/address.controller.gates.spec.ts
 *
 * Authorization regression tests for AddressController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { AddressController } from "./address.controller.js";

describeGates(
  "AddressController",
  AddressController as never,
  [
    ["getAddressList", GateCode.CODE_CU],
    ["addAddress", GateCode.CODE_CU],
    ["updateAddress", GateCode.CODE_CU],
    ["deleteAddress", GateCode.CODE_CU],
  ],
  [],
);
