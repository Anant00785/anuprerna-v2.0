/**
 * src/commerce/settings/controller/settings.controller.gates.spec.ts
 *
 * Authorization regression tests for SettingsController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SettingsController } from "./settings.controller.js";

describeGates(
  "SettingsController",
  SettingsController as never,
  [
    ["getSettingById", GateCode.CODE_SUCU],
    ["updateSettings", GateCode.CODE_SU],
    ["getPaginatedSettings", GateCode.CODE_SU],
    ["getSettingExplorerById", GateCode.CODE_SU],
  ],
  // PUBLIC: Loom's SettingsController.getSettingsList() calls response.buildList()
  // directly (no getEntity/CODE_*), and the storefront fetches it during SSR with
  // no bearer token. A gate here 401s every page render.
  ["getAllSettings"],
);
