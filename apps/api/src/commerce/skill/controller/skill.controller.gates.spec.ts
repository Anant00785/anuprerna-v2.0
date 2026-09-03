/**
 * src/commerce/skill/controller/skill.controller.gates.spec.ts
 *
 * Authorization regression tests for SkillController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../../common/testing/gate-spec.js";
import { GateCode } from "../../../auth/types/auth.types.js";
import { SkillController } from "./skill.controller.js";

describeGates(
  "SkillController",
  SkillController as never,
  [
    ["getSkillList", GateCode.CODE_SUCU],
    ["getSkillById", GateCode.CODE_SU],
    ["updateSkill", GateCode.CODE_SU],
    ["getArtisanSkillMappings", GateCode.CODE_SU],
  ],
  [],
);
