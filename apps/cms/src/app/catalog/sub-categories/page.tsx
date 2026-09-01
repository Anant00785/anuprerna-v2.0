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

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function SubCategoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? await getServiceToken();
  const [
    items,
    categories,
    segments,
    badgeProfiles,
    volumeDiscountProfiles,
    sizeProfiles,
    customSizeProfiles,
    fabricProfiles,
    customFinishProfiles,
    madeToOrderProfiles,
  ] = await Promise.all([
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
  ]);
  return (
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
  );
}
