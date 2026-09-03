/**
 * Loom profile/custom_size/controller/CustomSizeProfileController.java passes
 * CODE_SU to every one of these five handlers — the whole controller is
 * superuser-only, reads included.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { CustomSizeProfileController } from "./custom-size-profile.controller.js";

describeGates(
  "CustomSizeProfileController",
  CustomSizeProfileController as never,
  [
    ["getCustomSizeProfileList", GateCode.CODE_SU],
    ["getCustomSizeProfile", GateCode.CODE_SU],
    ["addCustomSizeProfile", GateCode.CODE_SU],
    ["updateCustomSizeProfile", GateCode.CODE_SU],
    ["deleteCustomSizeProfile", GateCode.CODE_SU],
  ],
  [],
);
