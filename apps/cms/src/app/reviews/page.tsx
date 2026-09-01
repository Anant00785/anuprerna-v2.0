import React from "react";
import { cookies } from "next/headers";
import { getAllReviews } from "@/lib/admin-api";
import { getServiceToken } from "@/lib/loom-service-token";
import { ReviewsClient } from "./ReviewsClient";

export const dynamic = "force-dynamic";
const COOKIE = process.env.AUTH_COOKIE_NAME ?? "weave_token";

export default async function ReviewsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value ?? (await getServiceToken());
  const reviews = await getAllReviews(token);
  return <ReviewsClient reviews={reviews} />;
}
