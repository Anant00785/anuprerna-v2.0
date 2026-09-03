/**
 * src/commerce/product/controller/segment.controller.gates.spec.ts
 *
 * Authorization regression tests for SegmentController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SegmentController } from "./segment.controller.js";

describeGates(
  "SegmentController",
  SegmentController as never,
  [
    ["getSegment", GateCode.CODE_SU],
    ["createSegment", GateCode.CODE_SU],
    ["updateSegment", GateCode.CODE_SU],
    ["deleteSegment", GateCode.CODE_SU],
    ["getSegmentData", GateCode.CODE_SU],
    ["getSegmentDataById", GateCode.CODE_SU],
  ],
  ["getSegmentList", "fuzzySearchSegments", "getSegmentPreviewList", "getSegmentById"],
);
