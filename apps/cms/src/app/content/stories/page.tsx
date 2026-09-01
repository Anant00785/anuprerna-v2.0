import React from "react";
import { cookies } from "next/headers";
import { getStoryList, getStoryCategoryList } from "@/lib/content-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { StoryListClient } from "./StoryListClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function StoriesPage() {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE)?.value;
  const token = cookieToken ?? (await getServiceToken());
  const [stories, categories] = await Promise.all([
    getStoryList(token),
    getStoryCategoryList(token),
  ]);
  return <StoryListClient stories={stories} categories={categories} />;
}
