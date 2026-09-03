/**
 * src/commerce/cart/controller/cart.controller.gates.spec.ts
 *
 * Authorization regression tests for CartController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CartController } from "./cart.controller.js";

describeGates(
  "CartController",
  CartController as never,
  [
    ["getCartItemData", GateCode.CODE_SU],
    ["getCartItemById", GateCode.CODE_SU],
    ["getCartItemList", GateCode.CODE_CU],
    ["getCartItemListUsingUid", GateCode.CODE_SU],
    ["getCartItemListForTenants", GateCode.CODE_SU],
    ["addCartItem", GateCode.CODE_CU],
    ["updateCartItem", GateCode.CODE_CU],
    ["deleteCartItem", GateCode.CODE_CU],
    ["deleteAllCartItem", GateCode.CODE_CU],
  ],
  [],
);
