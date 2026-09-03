/**
 * src/commerce/filter/controller/filter.controller.gates.spec.ts
 *
 * Authorization regression tests for FilterController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { FilterController } from "./filter.controller.js";

describeGates(
  "FilterController",
  FilterController as never,
  [],
  // getSegmentList is deliberately ungated: /get/segment-list serves the exact
  // same 23 segments as the already-public /get/filter/segment/list twin, so the
  // gate protected nothing and only forced the storefront to mint a
  // service-account JWT to read a public list.
  [
    "getSegmentList",
    "getFabricFilterPreviewList",
    "getFabricPreviewListAlias",
    "getFabricFilterPreviewListPaginated",
    "getFinishedFilterPreviewList",
    "getFinishedPreviewListAlias",
    "getFilteredFabricFilterPreviewList",
    "getFilterSegmentList",
    "getFilterSegmentListSlash",
  ],
);
