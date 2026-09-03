/**
 * src/commerce/profile/controller/badge-profile.controller.gates.spec.ts
 *
 * Authorization regression tests for BadgeProfileController.
 *
 * Loom gates EVERY route on this controller at CODE_SU (each Java handler runs
 * through getEntity/postEntity with CODE_SU). The read + table-explorer routes
 * here were left ungated by the gate-coverage pass — an unauthenticated read of
 * admin catalogue configuration — and are gated now to match. No storefront or
 * CMS caller reaches them anonymously: the storefront gets this data embedded in
 * the product payload, and the CMS is session-gated in front of every route.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { BadgeProfileController } from "./badge-profile.controller.js";

describeGates(
  "BadgeProfileController",
  BadgeProfileController as never,
  [
    ["getBadgeProfileList", GateCode.CODE_SU],
    ["getBadgeProfile", GateCode.CODE_SU],
    ["addBadgeProfile", GateCode.CODE_SU],
    ["updateBadgeProfile", GateCode.CODE_SU],
    ["deleteBadgeProfile", GateCode.CODE_SU],
    ["exploreBadgeProfile", GateCode.CODE_SU],
    ["exploreBadgeProfileById", GateCode.CODE_SU],
    ["exploreBadgeProfileItem", GateCode.CODE_SU],
  ],
  [],
);
