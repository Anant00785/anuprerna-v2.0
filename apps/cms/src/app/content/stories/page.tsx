import React from "react";
import { cookies } from "next/headers";
import { getStoryList, getStoryCategoryList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { StoryListClient } from "./StoryListClient";
import { loadOrBanner } from "@/lib/load-or-banner";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function StoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  return loadOrBanner(
    () => Promise.all([
      getStoryList(token),
      getStoryCategoryList(token),
    ]),
    ([stories, categories]) => (<StoryListClient stories={stories} categories={categories} />),
  );
}
