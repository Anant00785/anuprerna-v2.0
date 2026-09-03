/**
 * Profile-cluster API — Milestone 2 of the Weave CMS rebuild.
 *
 * Read helpers for the seven profile types, plus WRITE-DISABLED create/update
 * stubs. Reads proxy live Loom (:8090) and need a bearer token (the page
 * supplies a cookie token or the server service token). Loom wraps each list
 * as { success, message, <key>: [...] }; extractFirstArray pulls the first
 * array-of-objects so we are resilient to the envelope key name.
 *
 * WRITE SAFETY: createProfile / updateProfile throw a 501-style error. In
 * build mode nothing is ever sent to Loom — the UI assembles the payload and
 * shows it in ProfilePayloadDrawer for review only.
 */

import {loomGetJson} from "@/lib/backend-fetch-error";
import type {
  ProfileBadgeItem,
  ProfileVolumeItem,
  ProfileSizeItem,
  ProfileCustomSizeItem,
  FabricProfileItem,
  ProfileCustomFinish,
  ProfileMadeToOrder,
} from "@/types/profiles";


/** Single backend GET for this module. All failure handling — network,
 *  HTTP, and the `{success:false}` envelope — lives in loomGetJson. */
const profileGet = <T,>(path: string, token?: string): Promise<T> =>
  loomGetJson<T>("profiles-api", path, token);

/** Extract the first array-of-objects from a Loom response envelope. */
function extractFirstArray<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== "object") return [];
  for (const value of Object.values(payload as Record<string, unknown>)) {
    if (Array.isArray(value) && value.length && typeof value[0] === "object") {
      return value as T[];
    }
  }
  return [];
}

async function fetchProfileList<T>(path: string, token?: string): Promise<T[]> {
  const payload = await profileGet<unknown>(path, token);
  return extractFirstArray<T>(payload);
}

// ── Read: list endpoints ──────────────────────────────────────────────────
export const getBadgeProfiles = (token?: string) =>
  fetchProfileList<ProfileBadgeItem>("/get/badge-profile-list", token);

export const getVolumeDiscountProfiles = (token?: string) =>
  fetchProfileList<ProfileVolumeItem>("/get/volume-discount-profile-list", token);

export const getSizeProfiles = (token?: string) =>
  fetchProfileList<ProfileSizeItem>("/get/size-profile-list", token);

export const getCustomSizeProfiles = (token?: string) =>
  fetchProfileList<ProfileCustomSizeItem>("/get/custom-size-profile-list", token);

export const getFabricProfiles = (token?: string) =>
  fetchProfileList<FabricProfileItem>("/get/fabric-profile-list", token);

export const getCustomFinishProfiles = (token?: string) =>
  fetchProfileList<ProfileCustomFinish>("/get/finish-profile-list", token);

export const getMadeToOrderProfiles = (token?: string) =>
  fetchProfileList<ProfileMadeToOrder>("/get/made-to-order-profile-list", token);

// ── Write: DISABLED in build mode ──────────────────────────────────────────
// Loom write endpoints (kept here so the payload preview can show them):
//   badge        POST /add/badge-profile               PUT /update/badge-profile/{id}
//   volume       POST /add/volume-discount-profile     PUT /update/volume-discount-profile
//   size         POST /add/size-profile                PUT /update/size-profile/{id}
//   customSize   POST /add/custom-size-profile         PUT /update/custom-size-profile
//   fabric       POST /add/fabric-profile              PUT /update/fabric-profile/{id}
//   customFinish POST /add/finish-profile              PUT /update/finish-profile/{id}
//   madeToOrder  POST /add/made-to-order-profile       PUT /update/made-to-order-profile

export class WritesDisabledError extends Error {
  readonly status = 501;
  constructor(message = "Preview — saves go live at launch (writes disabled)") {
    super(message);
    this.name = "WritesDisabledError";
  }
}

/** Always throws — writes are disabled while the CMS is in build mode. */
export function createProfile(): never {
  throw new WritesDisabledError();
}

/** Always throws — writes are disabled while the CMS is in build mode. */
export function updateProfile(): never {
  throw new WritesDisabledError();
}
