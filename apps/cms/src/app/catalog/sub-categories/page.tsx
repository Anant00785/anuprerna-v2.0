import React from "react";
import { cookies } from "next/headers";
import { getSubCategoryList } from "@/lib/catalog-api";
import { getCategories, getSegments } from "@/lib/api";
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
import { SubCategoriesClient } from "./SubCategoriesClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function SubCategoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? await getServiceToken();
  return loadOrBanner(
    () => Promise.all([
      getSubCategoryList(token),
      getCategories(token),
      getSegments(token),
      getBadgeProfiles(token),
      getVolumeDiscountProfiles(token),
      getSizeProfiles(token),
      getCustomSizeProfiles(token),
      getFabricProfiles(token),
      getCustomFinishProfiles(token),
      getMadeToOrderProfiles(token),
    ]),
    ([items, categories, segments, badgeProfiles, volumeDiscountProfiles, sizeProfiles, customSizeProfiles, fabricProfiles, customFinishProfiles, madeToOrderProfiles]) => (
      <SubCategoriesClient
        items={items}
        categories={categories}
        segments={segments}
        badgeProfiles={badgeProfiles}
        volumeDiscountProfiles={volumeDiscountProfiles}
        sizeProfiles={sizeProfiles}
        customSizeProfiles={customSizeProfiles}
        fabricProfiles={fabricProfiles}
        customFinishProfiles={customFinishProfiles}
        madeToOrderProfiles={madeToOrderProfiles}
      />
    ),
  );
}
