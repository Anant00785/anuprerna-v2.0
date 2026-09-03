import React from "react";
import { cookies } from "next/headers";
import {
  getBadgeProfiles,
  getVolumeDiscountProfiles,
  getSizeProfiles,
  getCustomSizeProfiles,
  getFabricProfiles,
  getCustomFinishProfiles,
  getMadeToOrderProfiles,
} from "@/lib/profiles-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { getBackendCallToken } from "@/lib/backend-call-token";
import type { ProfileType } from "@/types/profiles";
import { ProfilesClient } from "./ProfilesClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

const VALID_TABS: ProfileType[] = [
  "badge",
  "volume",
  "size",
  "custom-size",
  "fabric",
  "custom-finish",
  "made-to-order",
];

export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const initialTab = VALID_TABS.includes(type as ProfileType)
    ? (type as ProfileType)
    : "badge";

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = await getBackendCallToken(cookieToken);

  return loadOrBanner(
    () => Promise.all([
      getBadgeProfiles(token),
      getVolumeDiscountProfiles(token),
      getSizeProfiles(token),
      getCustomSizeProfiles(token),
      getFabricProfiles(token),
      getCustomFinishProfiles(token),
      getMadeToOrderProfiles(token),
    ]),
    ([badge, volume, size, customSize, fabric, customFinish, madeToOrder]) => (
      <ProfilesClient
        badge={badge}
        volume={volume}
        size={size}
        customSize={customSize}
        fabric={fabric}
        customFinish={customFinish}
        madeToOrder={madeToOrder}
        initialTab={initialTab}
      />
    ),
  );
}
