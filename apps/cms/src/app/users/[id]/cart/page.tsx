/**
 * /users/[id]/cart — per-user "View Cart" drill (Server Component).
 *
 * Mirrors the live Angular ViewCartComponent: given a tenant UID it fetches that
 * user's cart items + profile header server-side (live-Loom token, GET-only,
 * read-only) and hands a Result to the client view. A bogus / unknown uid yields
 * a clean empty cart (tenant=null, zero items) — never a crash — matching live.
 */
import React from "react";
import { getUserCartDrill } from "./data";
import { UserCartView } from "./UserCartView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserCartPage({ params }: PageProps) {
  const { id } = await params;
  const uid = decodeURIComponent(id);

  const result = await getUserCartDrill(uid);

  if (!result.ok) {
    return <UserCartView uid={uid} tenant={null} items={[]} error={result.error} />;
  }

  return <UserCartView uid={uid} tenant={result.data.tenant} items={result.data.items} summary={result.data.summary} />;
}
