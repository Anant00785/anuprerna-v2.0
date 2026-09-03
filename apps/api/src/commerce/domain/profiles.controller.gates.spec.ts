/**
 * src/commerce/domain/profiles.controller.gates.spec.ts
 *
 * Authorization regression tests for ProfilesDomainController — generated as part of the
 * gate-coverage pass and checked against loom's Java originals. Each entry
 * below is the gate the route MUST carry; the real RolesGuard and the real
 * GatekeeperService run against the real @RequireGate metadata, so removing
 * a gate fails here.
 */
import "reflect-metadata";
import { describeGates } from "../../common/testing/gate-spec.js";
import { GateCode } from "../../auth/types/auth.types.js";
import { ProfilesDomainController } from "./profiles.controller.js";

describeGates(
  "ProfilesDomainController",
  ProfilesDomainController as never,
  [
    ["post_add_size_profile_option", GateCode.CODE_SU],
    ["patch_update_size_profile_option", GateCode.CODE_SU],
    ["delete_delete_size_profile_option_sizeProfileOptionId", GateCode.CODE_SU],
    ["get_get_usage_size_profile_option_sizeProfileOptionId", GateCode.CODE_SU],
    ["post_add_size_profile_guide", GateCode.CODE_SU],
    ["patch_update_size_profile_guide", GateCode.CODE_SU],
    ["delete_delete_size_profile_guide_sizeProfileGuideId", GateCode.CODE_SU],
    ["get_get_finish_profile_list", GateCode.CODE_SU],
    ["get_get_finish_profile_profileId", GateCode.CODE_SU],
    ["post_add_finish_profile", GateCode.CODE_SU],
    ["patch_update_finish_profile_profileId", GateCode.CODE_SU],
    ["delete_delete_finish_profile_profileId", GateCode.CODE_SU],
    ["get_get_usage_finish_profile_item_finishItemId", GateCode.CODE_SU],
    ["delete_delete_finish_profile_item_finishItemId", GateCode.CODE_SU],
    ["get_get_artisan_profile", GateCode.CODE_SU],
    ["patch_update_artisan_profile", GateCode.CODE_SU],
    ["get_get_table_explorer_data_finish_profile_item_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_size_profile_guide_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_size_profile_option_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_finish_profile_id", GateCode.CODE_SU],
    ["get_get_table_explorer_data_finish_profile_item", GateCode.CODE_SU],
    ["get_get_table_explorer_data_finish_profile", GateCode.CODE_SU],
  ],
  [],
);
