/**
 * src/commerce/domain/image-optimization.controller.gates.spec.ts
 *
 * Authorization regression tests for ImageOptimizationDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { ImageOptimizationDomainController } from "./image-optimization.controller.js";

describeGates(
  "ImageOptimizationDomainController",
  ImageOptimizationDomainController as never,
  [
    ["get_get_image_optimization_overview", GateCode.CODE_SU],
    ["get_get_image_optimization_records", GateCode.CODE_SU],
    ["get_get_image_optimization_analytics", GateCode.CODE_SU],
    ["get_get_image_optimization_unsupported", GateCode.CODE_SU],
    ["get_get_image_optimization_threads", GateCode.CODE_SU],
    ["get_get_image_optimization_tools", GateCode.CODE_SU],
    ["get_get_image_optimization_progress", GateCode.CODE_SU],
    ["get_get_image_optimization_bucket", GateCode.CODE_SU],
    ["patch_update_image_optimization_discovery_run", GateCode.CODE_SU],
    ["patch_update_image_optimization_requeue", GateCode.CODE_SU],
    ["patch_update_image_optimization_main_pause", GateCode.CODE_SU],
    ["patch_update_image_optimization_main_resume", GateCode.CODE_SU],
    ["patch_update_image_optimization_main_settings", GateCode.CODE_SU],
    ["patch_update_image_optimization_tools_preset", GateCode.CODE_SU],
    ["patch_update_image_optimization_tools_option", GateCode.CODE_SU],
    ["patch_update_image_optimization_tools_enabled", GateCode.CODE_SU],
  ],
  [],
);
