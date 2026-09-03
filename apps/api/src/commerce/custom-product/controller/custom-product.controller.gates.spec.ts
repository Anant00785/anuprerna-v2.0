/**
 * Authorization regression tests for CustomProductController, checked against
 * loom product/controller/CustomProductController.java — all four routes pass
 * CODE_SU to getEntity/postEntity.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CustomProductController } from "./custom-product.controller.js";

describeGates(
  "CustomProductController",
  CustomProductController as never,
  [
    ["getCustomProducts", GateCode.CODE_SU],
    ["getCustomProduct", GateCode.CODE_SU],
    ["addCustomProduct", GateCode.CODE_SU],
    ["updateCustomProduct", GateCode.CODE_SU],
  ],
  [],
);
