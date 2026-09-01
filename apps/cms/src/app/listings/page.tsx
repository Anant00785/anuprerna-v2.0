/**
 * /listings — Catalog Listings page (Server Component shell).
 *
 * Renders INSTANTLY: shell + skeleton, zero server-side fetching. The current
 * page of products (default 50) loads client-side via /api/listings, which
 * hits the paginated native wrapper endpoint (/get/listings/preview) backed by
 * our pg copy — replacing the old force-dynamic page that blocked SSR while
 * pulling the full ~37 MB fabric+finished preview payload.
 */
import React from "react";
import { ListingsClient } from "./ListingsClient";

export default function ListingsPage() {
  return <ListingsClient />;
}
